import {Building} from "./Building";
import * as http from "http";
import {InsightError} from "./IInsightFacade";
import {Room} from "./Room";

export class BuildingHelper {
    // private arrayOfBuildings: any;

    constructor() {
        // this.arrayOfBuildings = [];
    }

    public getTrElements(htmlObject: any,
                         nameToFind: string,
                         attrsName: string,
                         attrsValue: string,
                         arrayName: string): any[] | boolean {  // be table for first time

        if (htmlObject.nodeName === nameToFind) {
            for (let attribute of htmlObject.attrs) {
                if (attribute.name === attrsName && attribute.value === attrsValue) {
                    for (let child of htmlObject.childNodes) {
                        if (child.nodeName === arrayName) { // tbody
                            return child.childNodes;
                        }
                    }
                }
            }
        }
        if (!Object.keys(htmlObject).includes("childNodes") || htmlObject.childNodes.length === 0) {
            return false;
        } else {
            for (let object of htmlObject.childNodes) {
                let recurseResult: any = this.getTrElements(object, nameToFind, attrsName, attrsValue, arrayName);
                if (recurseResult !== false) {
                    return recurseResult;
                }
            }
        }
        return false;
    }

    public getBuildings(tbody: any[]): Promise<any> {
        let that = this;
        return new Promise<any>(function (resolve, reject) {
            let promArray: any[] = [];
            for (let i = 1; i < tbody.length; i = i + 2) {
                let buildingProm: Promise<any> = that.getBuildingData(tbody[i]);
                promArray.push(buildingProm);
            }
            Promise.all(promArray).then(function (arrayOfBuildsProm: any[]) {
                resolve(arrayOfBuildsProm);
            });
        });
    }

    public getBuildingData(tr: any): Promise<any> {
        let hrefGParent: any = tr.childNodes[5]; // first occurance of td
        let a: any = hrefGParent.childNodes[1]; // a
        let hrefObject: any = a.attrs[0];
        let href: string = hrefObject["value"]; // href
        let shortName: string = tr.childNodes[3].childNodes[0]["value"];
        shortName = shortName.substring(3, shortName.length - 1).trim(); // shortName
        let longName: string = tr.childNodes[5].childNodes[1].childNodes[0]["value"]; // longName
        let address: string = tr.childNodes[7].childNodes[0]["value"];
        address = address.substring(3, address.length - 1).trim(); // address
        let urlAddress: any = address.replace(/ /g, "%20");
        urlAddress = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_p8r1b_z0i0b/" + urlAddress;
        return this.getGeo(urlAddress, longName, shortName, address, href);
    }

    public getRoomData(tbody: any[], buildShort: string, buildFull: string,
                       buildAdd: string, buildLat: number, buildLon: number): Room[] {
        let roomArray: Room[] = [];
        for (let i = 1; i < tbody.length; i = i + 2) {
            let currTr: any = tbody[i];
            let roomNumber: string = currTr.childNodes[1].childNodes[1].childNodes[0]["value"];
            // let roomNumber1: string = roomNumber;
            let seatsString: string = currTr.childNodes[3].childNodes[0]["value"];
            let seats: number = parseInt(seatsString, 10);
            /*seatsString = seatsString.substring(3, seatsString - 1);
            seatsString = seatsString.trim();
            let seats = seatsString...*/
            let roomType: string = currTr.childNodes[7].childNodes[0]["value"];
            // let roomType2: string = roomType;
            roomType = roomType.substring(2, roomType.length - 1);
            roomType = roomType.trim();
            let furniture: string = currTr.childNodes[5].childNodes[0]["value"];
            // let furniture1: string = furniture;
            furniture = furniture.substring(2, furniture.length - 1);
            furniture = furniture.trim();
            let href: string = currTr.childNodes[1].childNodes[1].attrs[0]["value"];
            // let href1: string = href;
            roomArray.push(new Room(buildFull, buildShort, roomNumber, buildShort + "_" + roomNumber,
                buildAdd, buildLat, buildLon, seats, roomType, furniture, href));
        }
        return roomArray;
    }

    public getGeo(urlAddress: string,
                  longName: string,
                  shortName: string,
                  address: string,
                  href: string): Promise<any> {
        return new Promise(function (fulfill, reject) {
            http.get(urlAddress, function (res: any) {
                const {statusCode} = res;

                let error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        `Status Code: ${statusCode}`);
                }
                if (error) {
                    // consume response data to free up memory
                    res.resume();
                    return reject(new InsightError(error));
                }

                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", function (chunk: any) {
                    rawData += chunk;
                });
                res.on("end", function () {
                    let parsedJSON: any = JSON.parse(rawData);
                    let lat: number = parsedJSON.lat;
                    let lon: number = parsedJSON.lon;
                    let buildingInst: Building = new Building(longName, shortName, address, lat, lon, href);
                    fulfill(buildingInst);
                });
            }).on("error", (e) => {
                return reject(new InsightError("Error getting URL"));
            });
        });
    }
}
