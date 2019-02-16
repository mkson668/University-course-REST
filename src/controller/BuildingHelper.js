"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Building_1 = require("./Building");
const http = require("http");
const IInsightFacade_1 = require("./IInsightFacade");
const Room_1 = require("./Room");
class BuildingHelper {
    constructor() {
    }
    getTrElements(htmlObject, nameToFind, attrsName, attrsValue, arrayName) {
        if (htmlObject.nodeName === nameToFind) {
            for (let attribute of htmlObject.attrs) {
                if (attribute.name === attrsName && attribute.value === attrsValue) {
                    for (let child of htmlObject.childNodes) {
                        if (child.nodeName === arrayName) {
                            return child.childNodes;
                        }
                    }
                }
            }
        }
        if (!Object.keys(htmlObject).includes("childNodes") || htmlObject.childNodes.length === 0) {
            return false;
        }
        else {
            for (let object of htmlObject.childNodes) {
                let recurseResult = this.getTrElements(object, nameToFind, attrsName, attrsValue, arrayName);
                if (recurseResult !== false) {
                    return recurseResult;
                }
            }
        }
        return false;
    }
    getBuildings(tbody) {
        let that = this;
        return new Promise(function (resolve, reject) {
            let promArray = [];
            for (let i = 1; i < tbody.length; i = i + 2) {
                let buildingProm = that.getBuildingData(tbody[i]);
                promArray.push(buildingProm);
            }
            Promise.all(promArray).then(function (arrayOfBuildsProm) {
                resolve(arrayOfBuildsProm);
            });
        });
    }
    getBuildingData(tr) {
        let hrefGParent = tr.childNodes[5];
        let a = hrefGParent.childNodes[1];
        let hrefObject = a.attrs[0];
        let href = hrefObject["value"];
        let shortName = tr.childNodes[3].childNodes[0]["value"];
        shortName = shortName.substring(3, shortName.length - 1).trim();
        let longName = tr.childNodes[5].childNodes[1].childNodes[0]["value"];
        let address = tr.childNodes[7].childNodes[0]["value"];
        address = address.substring(3, address.length - 1).trim();
        let urlAddress = address.replace(/ /g, "%20");
        urlAddress = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_p8r1b_z0i0b/" + urlAddress;
        return this.getGeo(urlAddress, longName, shortName, address, href);
    }
    getRoomData(tbody, buildShort, buildFull, buildAdd, buildLat, buildLon) {
        let roomArray = [];
        for (let i = 1; i < tbody.length; i = i + 2) {
            let currTr = tbody[i];
            let roomNumber = currTr.childNodes[1].childNodes[1].childNodes[0]["value"];
            let seatsString = currTr.childNodes[3].childNodes[0]["value"];
            let seats = parseInt(seatsString, 10);
            let roomType = currTr.childNodes[7].childNodes[0]["value"];
            roomType = roomType.substring(2, roomType.length - 1);
            roomType = roomType.trim();
            let furniture = currTr.childNodes[5].childNodes[0]["value"];
            furniture = furniture.substring(2, furniture.length - 1);
            furniture = furniture.trim();
            let href = currTr.childNodes[1].childNodes[1].attrs[0]["value"];
            roomArray.push(new Room_1.Room(buildFull, buildShort, roomNumber, buildShort + "_" + roomNumber, buildAdd, buildLat, buildLon, seats, roomType, furniture, href));
        }
        return roomArray;
    }
    getGeo(urlAddress, longName, shortName, address, href) {
        return new Promise(function (fulfill, reject) {
            http.get(urlAddress, function (res) {
                const { statusCode } = res;
                let error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        `Status Code: ${statusCode}`);
                }
                if (error) {
                    res.resume();
                    return reject(new IInsightFacade_1.InsightError(error));
                }
                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", function (chunk) {
                    rawData += chunk;
                });
                res.on("end", function () {
                    let parsedJSON = JSON.parse(rawData);
                    let lat = parsedJSON.lat;
                    let lon = parsedJSON.lon;
                    let buildingInst = new Building_1.Building(longName, shortName, address, lat, lon, href);
                    fulfill(buildingInst);
                });
            }).on("error", (e) => {
                return reject(new IInsightFacade_1.InsightError("Error getting URL"));
            });
        });
    }
}
exports.BuildingHelper = BuildingHelper;
//# sourceMappingURL=BuildingHelper.js.map