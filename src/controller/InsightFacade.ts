import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Section} from "./Section";
import {SyntaxHelpers} from "./SyntaxHelpers";
import {ParseQueryHelper} from "./ParseQueryHelper";
import {IFilter} from "./IFilter";
import {ResultHelper} from "./ResultHelper";
import {InsightDataHelper} from "./InsightDataHelper";
import {Room} from "./Room";
import {BuildingHelper} from "./BuildingHelper";

let fs = require("fs");
let util = require ("util");
let JSZip = require("jszip");
let parse5 = require("parse5");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasetMap: object;
    private datasetIDs: any;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetMap = {};
        this.datasetIDs = [];
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // TODO this is missing check for if the dataset id exists when adding to datasets.txt
            let zip: any = new JSZip();
            let that: any = this;
            return new Promise(function (fulfill, reject) {
                if (kind === InsightDatasetKind.Courses) {
                    if (!fs.existsSync("./data/")) {
                        fs.mkdirSync("./data/");
                    }
                    if (content === undefined || content === null || content === "") {
                        return reject(new InsightError("cannot be null, undefined, or empty string as content"));
                    }
                    if (id === undefined || id === null || id === "") {
                        return reject(new InsightError("cannot be null, undefined, or empty string as id"));
                    }
                    // check if file exists, if it exists then load it, if it does not then create it
                    if (fs.existsSync("./data/" + "added" + ".txt")) {
                        let idCheckArray: any = fs.readFileSync("./data/added.txt", "utf-8");
                        if (idCheckArray.includes(" " + id + " ")) {
                            return reject(new InsightError("dataset id already exists"));
                        }
                    }

                    zip.loadAsync(content, {base64: true}).then(function (result: any) {
                        zip = result;
                        let sectionsArray: Section[] = [];
                        let promiseArray: any = [];
                        zip.folder("courses").forEach(function (relativePath: any, file: any) {
                            let validJSON: boolean = true;
                            promiseArray.push(file.async("string").then(function (text: any) {
                                let parseText: any;
                                try {
                                    parseText = JSON.parse(text);
                                } catch (e) {
                                    // return reject(new InsightError("JSON.parse doesn't not work"));
                                    validJSON = false;
                                }
                                if (validJSON) {
                                    let allSections: any = parseText["result"];
                                    for (let section of allSections) {
                                        if (section["Section"] === "overall") {
                                            let oneSection: Section = new Section(section["Subject"],
                                                section["Course"],
                                                section["Avg"],
                                                section["Professor"],
                                                section["Title"],
                                                section["Pass"],
                                                section["Fail"],
                                                section["Audit"],
                                                section["id"],
                                                "1900"); // case for 1900 section
                                            sectionsArray.push(oneSection);
                                        } else {
                                            let oneSection: Section = new Section(section["Subject"],
                                                section["Course"],
                                                section["Avg"],
                                                section["Professor"],
                                                section["Title"],
                                                section["Pass"],
                                                section["Fail"],
                                                section["Audit"],
                                                section["id"],
                                                section["Year"]);
                                            sectionsArray.push(oneSection);
                                        }
                                    }
                                }
                            }));
                        });
                        Promise.all(promiseArray).then(function (results) {
                            if (sectionsArray.length === 0) {
                                return reject(new InsightError("no valid sections in this dataset!"));
                            }
                            that.datasetMap[id] = sectionsArray;
                            let toStoreDatasetMap: string = JSON.stringify(sectionsArray);
                            fs.writeFileSync("./data/" + id + ".txt", toStoreDatasetMap);
                            let addedExists: boolean = fs.existsSync("./data/added.txt");
                            let allIDs: string;
                            if (addedExists) {
                                let oldIDs: any = fs.readFileSync("./data/added.txt", "utf-8");
                                allIDs = oldIDs + id + " ";
                            } else {
                                allIDs = " " + id + " ";
                            }
                            fs.writeFileSync("./data/" + "added" + ".txt", allIDs);
                            allIDs = allIDs.substring(0, allIDs.length - 1); // take of erroneous last white space
                            let idArray: any = [];
                            let ind: number = 0;
                            while (ind < allIDs.length && ind !== -1) {
                                ind = allIDs.indexOf(" ", ind);
                                let nextInd: number = allIDs.indexOf(" ", ind + 2);
                                if (nextInd === -1) {
                                    nextInd = allIDs.length;
                                }
                                let sub: string = allIDs.substring(ind + 1, nextInd);
                                idArray.push(sub);
                                ind = allIDs.indexOf(" ", ind + 1);
                            }
                            // Insight Dataset
                            let insightDataHelper: InsightDataHelper = new InsightDataHelper();
                            let datasetToAdd: InsightDataset =
                                insightDataHelper.createInsightDataset(id, kind, sectionsArray.length);
                            if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                                let oldDatasets: any = fs.readFileSync("./data/" + "datasets" + ".txt", "utf-8");
                                let jsonObj: any = JSON.parse(oldDatasets);
                                let arrayOfDatasets: InsightDataset[] = jsonObj;
                                arrayOfDatasets.push(datasetToAdd);
                                let newJsonObj = JSON.stringify(arrayOfDatasets);
                                fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                let arrayOfNames: string[] = [];
                                for (let dset of arrayOfDatasets) {
                                    arrayOfNames.push(dset.id);
                                }
                                fulfill(arrayOfNames);
                            } else {
                                let arrayOfDatasets: InsightDataset[] = [];
                                arrayOfDatasets.push(datasetToAdd);
                                let newJsonObj = JSON.stringify(arrayOfDatasets);
                                fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                let arrayOfNames: string[] = [];
                                for (let dset of arrayOfDatasets) {
                                    arrayOfNames.push(dset.id);
                                }
                                fulfill(arrayOfNames);
                            }
                            // fulfill(arrayOfNames);
                        });
                    }).catch(function (error: any) {
                        return reject(new InsightError("loadAsync is not working"));
                    });
                } else if (kind === InsightDatasetKind.Rooms) {
                    // do stuff
                    if (!fs.existsSync("./data/")) {
                        fs.mkdirSync("./data/");
                    }
                    if (content === undefined || content === null || content === "") {
                        return reject(new InsightError("cannot be null, undefined, or empty string as content"));
                    }
                    if (id === undefined || id === null || id === "") {
                        return reject(new InsightError("cannot be null, undefined, or empty string as id"));
                    }
                    // check if file exists, if it exists then load it, if it does not then create it
                    if (fs.existsSync("./data/" + "added" + ".txt")) {
                        let idCheckArray: any = fs.readFileSync("./data/added.txt", "utf-8");
                        if (idCheckArray.includes(" " + id + " ")) {
                            return reject(new InsightError("dataset id already exists"));
                        }
                    }
                    zip.loadAsync(content, {base64: true}).then(function (result: any) {
                        zip = result;
                        let roomsArray: string[] = [];
                        let buildHelper: BuildingHelper = new BuildingHelper();
                        zip.file("index.htm").async("string").then(function (data: any) {
                            let roomsData: any = data;
                            let trArray: any;
                            let parsedHTML: any = parse5.parse(roomsData);
                            trArray = buildHelper.getTrElements(parsedHTML,
                                "table",
                                "class",
                                "views-table cols-5 table",
                                "tbody");
                            let tbody: any = trArray;
                            buildHelper.getBuildings(tbody).then(function (arrayOfBs) {
                                let arrayOfBuildings = arrayOfBs;  // buildings completed; now go to rooms
                                let promBuildingArray: any = [];
                                for (let building of arrayOfBuildings) {
                                    promBuildingArray.push(zip.file(building.href.substring(2, building.href.length))
                                        .async("string"));
                                }
                                Promise.all(promBuildingArray).then(function (results) {
                                    let allRooms: any[] = [];
                                    let index: number = 0;
                                    let arrayOfRoomsInBuild: Room[] = [];
                                    for (let buildingFile of results) {
                                        let parsedRoomHTML: any = parse5.parse(buildingFile);
                                        let trRoomArray: any = buildHelper.getTrElements(parsedRoomHTML,
                                            "table",
                                            "class",
                                            "views-table cols-5 table",
                                            "tbody");
                                        if (trRoomArray !== false) {
                                            let arrayOfRooms: Room[] = buildHelper.getRoomData(trRoomArray,
                                                arrayOfBuildings[index].shortName,
                                                arrayOfBuildings[index].fullName,
                                                arrayOfBuildings[index].address,
                                                arrayOfBuildings[index].lat,
                                                arrayOfBuildings[index].lon);
                                            for (let room of arrayOfRooms) {
                                                allRooms.push(room);
                                            }
                                        }
                                        index++;
                                    }
                                    if (allRooms.length === 0) {
                                        return reject(new InsightError("no valid rooms in this room dataset!"));
                                    }
                                    that.datasetMap[id] = allRooms;
                                    let toStoreDatasetMap: string = JSON.stringify(allRooms);
                                    fs.writeFileSync("./data/" + id + ".txt", toStoreDatasetMap);
                                    let addedExists: boolean = fs.existsSync("./data/added.txt");
                                    let allIDs: string;
                                    if (addedExists) {
                                        let oldIDs: any = fs.readFileSync("./data/added.txt", "utf-8");
                                        allIDs = oldIDs + id + " ";
                                    } else {
                                        allIDs = " " + id + " ";
                                    }
                                    fs.writeFileSync("./data/" + "added" + ".txt", allIDs);
                                    allIDs = allIDs.substring(0, allIDs.length - 1);
                                    let idArray: any = [];
                                    let ind: number = 0;
                                    while (ind < allIDs.length && ind !== -1) {
                                        ind = allIDs.indexOf(" ", ind);
                                        let nextInd: number = allIDs.indexOf(" ", ind + 2);
                                        if (nextInd === -1) {
                                            nextInd = allIDs.length;
                                        }
                                        let sub: string = allIDs.substring(ind + 1, nextInd);
                                        idArray.push(sub);
                                        ind = allIDs.indexOf(" ", ind + 1);
                                    }
                                    // Insight Dataset
                                    let insightDataHelper: InsightDataHelper = new InsightDataHelper();
                                    let datasetToAdd: InsightDataset =
                                        insightDataHelper.createInsightDataset(id, kind, allRooms.length);
                                    if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                                        let oldDatasets: any = fs.readFileSync("./data/" + "datasets" + ".txt",
                                            "utf-8");
                                        let jsonObj: any = JSON.parse(oldDatasets);
                                        let arrayOfDatasets: InsightDataset[] = jsonObj;
                                        arrayOfDatasets.push(datasetToAdd);
                                        let newJsonObj = JSON.stringify(arrayOfDatasets);
                                        fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                        let arrayOfNames: any[] = [];
                                        for (let dset of arrayOfDatasets) {
                                            arrayOfNames.push(dset.id);
                                        }
                                        fulfill(arrayOfNames);
                                    } else {
                                        let arrayOfDatasets: InsightDataset[] = [];
                                        arrayOfDatasets.push(datasetToAdd);
                                        let newJsonObj = JSON.stringify(arrayOfDatasets);
                                        fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                        let arrayOfNames: any[] = [];
                                        for (let dset of arrayOfDatasets) {
                                            arrayOfNames.push(dset.id);
                                        }
                                        let arrayId = arrayOfNames;
                                        fulfill(arrayOfNames);
                                    }
                                    // fulfill(idArray);
                                }).catch(function (err) {
                                    reject(new InsightError(err));
                                });
                                // fulfill(roomsArray);
                            }).catch(function (err)  {
                                reject(err);
                            });
                        }).catch(function (error: any) {
                            return reject(new InsightError("parse5 error"));
                        });
                    });
                } else {
                    return reject(new InsightError("invalid kind"));
                }
            });
    }

    public removeDataset(id: string): Promise<string> {
        let that: any = this;
        return new Promise<string>(function (fulfill, reject) {
            if (id === undefined || id === null || id === "") {
                return reject(new InsightError("null, undefined, empty string ids are not permitted"));
            }
            if (!fs.existsSync("./data/added.txt")) {
                return reject(new InsightError("added id's file has been removed cannot continue"));
            } else {
                let idCheckString: any = fs.readFileSync("./data/added.txt", "utf-8");
                if (!idCheckString.includes(" " + id + " ")) {
                    return reject(new NotFoundError("this id was not a added dataset"));
                } else {
                    let trimmedCheckString: string = idCheckString.replace( " " + id + " ", " ");
                    fs.writeFileSync("./data/added.txt", trimmedCheckString);
                    fs.unlinkSync("./data/" + id + ".txt");
                    // delete from cache
                    delete that.datasetMap[id];
                    let map: any = that.datasetMap;

                    // Insight Dataset maintenance
                    let oldDatasets: string = fs.readFileSync("./data/" + "datasets" + ".txt", "utf-8");
                    let arrayOfDatasets: any = JSON.parse(oldDatasets);
                    for (let x = 0; x < arrayOfDatasets.length; x++) {
                        if (arrayOfDatasets[x].id === id) {
                            arrayOfDatasets.splice(x, 1);
                            let newArrayOfDatasets: any = arrayOfDatasets;
                            let newJsonObj: any = JSON.stringify(newArrayOfDatasets);
                            fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                        }
                    }
                    fulfill(id);
                }
            }
        });
    }

    public performQuery(query: any): Promise <any[]> {
        let that: any = this;
        return new Promise<any[]>(function (fulfill, reject) {
            let currentDatasetId: string = "";
            let syntaxhelper: SyntaxHelpers = new SyntaxHelpers();
            let whereFlag: boolean = false;
            let optionsFlag: boolean = false;
            let transFlag: boolean = false;
            let transValidity: boolean = false;
            let whereValidity: boolean = false;
            let optionsValidity: boolean = false;
            let applyKeys: any[] = null;
            for (let key in query) {
                if (key === "WHERE") {
                    if (!whereFlag) {
                        whereValidity = syntaxhelper.checkSyntax(query[key], key);
                        if (!whereValidity) {
                            return reject(new InsightError("Body format is incorrect"));
                        }
                        whereFlag = true;
                    } else {
                        return reject(new InsightError("Multiple bodies or options"));
                    }
                } else if (key === "OPTIONS") {
                    if (!optionsFlag) {
                        optionsValidity = syntaxhelper.checkOptionsSyntax(query[key], key);
                        if (!optionsValidity) {
                            return reject(new InsightError("Options not valid"));
                        }
                        optionsFlag = true;
                    } else {
                        return reject(new InsightError("Multiple bodies or options"));
                    }
                } else if (key === "TRANSFORMATIONS") {
                    if (!transFlag) {
                        transValidity = syntaxhelper.checkTransformSyntax(query[key]);
                        if (!transValidity) {
                            return reject(new InsightError("Trans not valid"));
                        }
                        transFlag = true;
                        // applyKeys = syntaxhelper.getApplyKeys();      // give me ma apply keys!!!
                    } else {
                        return reject(new InsightError("Multiple bodies or options"));
                    }
                } else {
                    return reject(new InsightError("Outer Key Not Options nor Where"));
                }
            }
            // if (whereValidity && optionsValidity) {
            for (let obj of syntaxhelper.returnApplyKeys()) {
                if (!obj["seen"]) {
                    return reject(new InsightError("ApplyKey in Column not seen in Apply Options"));
                }
            }
            //
            Log.trace("now both are valid");                // La cobertura es clave ;) puta madre weon
            Log.info("and we wanna continue");
            Log.test("are we sure?");
            Log.error("get in");
            Log.warn("jajajajajajaja");
            let parser: ParseQueryHelper = new ParseQueryHelper();
            let filter: IFilter = parser.parseQuery(query["WHERE"]);
            let option: any = parser.parseOptions(query["OPTIONS"]);
            let transformFilter: any = null;
            if (transFlag) {
                transformFilter = parser.parseTransform(query["TRANSFORMATIONS"]);
            }
            currentDatasetId = syntaxhelper.returnCurrentDatasetID();
            let resultHelper: ResultHelper = new ResultHelper();
            let results: any;
            if (Object.keys(that.datasetMap).includes(currentDatasetId)) {
                let dataArray: any[] = that.datasetMap[currentDatasetId];
                results = resultHelper.getResultsArray(dataArray, filter, option, transformFilter);
                if (results === false) {
                    return reject(new InsightError("more than 5000 valid sections"));
                }
            } else {
                if (fs.existsSync("./data/" + currentDatasetId + ".txt")) {
                    let dataFromMem: string = fs.readFileSync("./data/" + currentDatasetId + ".txt", "utf-8");
                    let arrayOfObjects: any = JSON.parse(dataFromMem);
                    // let dataArray: any[] = jsonObj[currentDatasetId]; there will be no key value pair
                    results = resultHelper.getResultsArray(arrayOfObjects, filter, option, transformFilter);
                    if (results === false) {
                        return reject(new InsightError("more than 5000 valid sections"));
                    }
                } else {
                    return reject(new InsightError("query dataset does not exist"));
                }
            }
            return fulfill(results);
            // } else {
            //    return reject(new InsightError("query not valid"));
            // }
            // return Promise.reject("Not implemented.");   // Eventually delete this line
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise(function (fulfill, reject) {
            if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                let dataFromDatasets: any = fs.readFileSync("./data/datasets.txt", "utf-8");
                let parsedDataFromDatasets: InsightDataset[] = JSON.parse(dataFromDatasets);
                fulfill(parsedDataFromDatasets);
            } else {
                fulfill([]);
            }
        });
    }
}
