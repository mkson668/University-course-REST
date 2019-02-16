/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static insightServer: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
        if (!Server.insightServer) {
            Server.insightServer = new InsightFacade(); // TODO how do we do static and is that way to go?}
        }
    }
    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", Server.putServer);
                that.rest.get("/datasets", Server.getDatasetsServer);
                that.rest.del("/dataset/:id", Server.deleteServer);
                that.rest.post("/query", Server.postServer);
                // This must be the last endpoint!

                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static putServer(req: restify.Request, res: restify.Response, next: restify.Next) {
        // Log.trace("Server::putServer(..) - params: " + JSON.stringify(req.params));
        try {
            let id = req.params.id;
            let kind = req.params.kind;
            let content = req.params.body;  // TODO convert to base 64 string?
            content = (content).toString("base64");
            Log.info("Server::putServer(..) - responding " + 200);
            let addedDatasets = Server.insightServer.addDataset(id, content, kind);
            addedDatasets.then(function (data) {
                res.json(200, {result: data});
                return next();
            }).catch(function (err) {
                Log.error("Server::putServer(..) - responding 400");
                res.json(400, {error: err.message});
                return next();
            });
        } catch (err) {
            Log.error("Server::putServer(..) - responding 400");
            res.json(400, {error: err.message});
            return next();
        }
    }

    private static postServer(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::postServer(..) - params: " + JSON.stringify(req.params));
        try {
            let query = req.params;
            Log.info("Server::postServer(..) - responding " + 200);
            let arrayOfResults = Server.insightServer.performQuery(query);
            arrayOfResults.then(function (data) {
                res.json(200, {result: data});
                return next();
            }).catch(function (err) {
                Log.error("Server::postServer(..) - responding 400");
                res.json(400, {error: err.message});
                return next();
            });
        } catch (err) {
            Log.error("Server::postServer(..) - responding 400");
            res.json(400, {error: err.message});
            return next();
        }
    }

    private static deleteServer(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::putServer(..) - params: " + JSON.stringify(req.params));
        try {
            let id = req.params.id;
            Log.info("Server::putServer(..) - responding " + 200);
            let deletedDataset = Server.insightServer.removeDataset(id);
            deletedDataset.then(function (data) {
                res.json(200, {result: data});
                return next();
            }).catch(function (err) {
                Log.error("Server::putServer(..) - responding 400");
                if (err instanceof InsightError) {
                    res.json(400, {error: err.message});
                    return next();
                } else {
                    res.json(404, {error: err.message});
                    return next();
                }
            });
        } catch (err) {
            Log.error("Server::putServer(..) - responding 400");
            res.json(400, {error: err.message});
            return next();
        }
    }

    private static getDatasetsServer(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::getDatasetsServer(..) - params: " + JSON.stringify(req.params));
        try {
            Log.info("Server::getDatasetsServer(..) - responding " + 200);
            let listOfDatasets = Server.insightServer.listDatasets();
            listOfDatasets.then(function (data) {
                res.json(200, {result: data});
                return next();
            });
        } catch (err) {
            Log.error("Server::getDatasetsServer(..) - responding 400");
            res.json(400, {error: err.message});
            return next();
        }
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
