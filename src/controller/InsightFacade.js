"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const Section_1 = require("./Section");
const SyntaxHelpers_1 = require("./SyntaxHelpers");
const ParseQueryHelper_1 = require("./ParseQueryHelper");
const ResultHelper_1 = require("./ResultHelper");
const InsightDataHelper_1 = require("./InsightDataHelper");
const BuildingHelper_1 = require("./BuildingHelper");
let fs = require("fs");
let util = require("util");
let JSZip = require("jszip");
let parse5 = require("parse5");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.datasetMap = {};
        this.datasetIDs = [];
    }
    addDataset(id, content, kind) {
        let zip = new JSZip();
        let that = this;
        return new Promise(function (fulfill, reject) {
            if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                if (!fs.existsSync("./data/")) {
                    fs.mkdirSync("./data/");
                }
                if (content === undefined || content === null || content === "") {
                    return reject(new IInsightFacade_1.InsightError("cannot be null, undefined, or empty string as content"));
                }
                if (id === undefined || id === null || id === "") {
                    return reject(new IInsightFacade_1.InsightError("cannot be null, undefined, or empty string as id"));
                }
                if (fs.existsSync("./data/" + "added" + ".txt")) {
                    let idCheckArray = fs.readFileSync("./data/added.txt", "utf-8");
                    if (idCheckArray.includes(" " + id + " ")) {
                        return reject(new IInsightFacade_1.InsightError("dataset id already exists"));
                    }
                }
                zip.loadAsync(content, { base64: true }).then(function (result) {
                    zip = result;
                    let sectionsArray = [];
                    let promiseArray = [];
                    zip.folder("courses").forEach(function (relativePath, file) {
                        let validJSON = true;
                        promiseArray.push(file.async("string").then(function (text) {
                            let parseText;
                            try {
                                parseText = JSON.parse(text);
                            }
                            catch (e) {
                                validJSON = false;
                            }
                            if (validJSON) {
                                let allSections = parseText["result"];
                                for (let section of allSections) {
                                    if (section["Section"] === "overall") {
                                        let oneSection = new Section_1.Section(section["Subject"], section["Course"], section["Avg"], section["Professor"], section["Title"], section["Pass"], section["Fail"], section["Audit"], section["id"], "1900");
                                        sectionsArray.push(oneSection);
                                    }
                                    else {
                                        let oneSection = new Section_1.Section(section["Subject"], section["Course"], section["Avg"], section["Professor"], section["Title"], section["Pass"], section["Fail"], section["Audit"], section["id"], section["Year"]);
                                        sectionsArray.push(oneSection);
                                    }
                                }
                            }
                        }));
                    });
                    Promise.all(promiseArray).then(function (results) {
                        if (sectionsArray.length === 0) {
                            return reject(new IInsightFacade_1.InsightError("no valid sections in this dataset!"));
                        }
                        that.datasetMap[id] = sectionsArray;
                        let toStoreDatasetMap = JSON.stringify(sectionsArray);
                        fs.writeFileSync("./data/" + id + ".txt", toStoreDatasetMap);
                        let addedExists = fs.existsSync("./data/added.txt");
                        let allIDs;
                        if (addedExists) {
                            let oldIDs = fs.readFileSync("./data/added.txt", "utf-8");
                            allIDs = oldIDs + id + " ";
                        }
                        else {
                            allIDs = " " + id + " ";
                        }
                        fs.writeFileSync("./data/" + "added" + ".txt", allIDs);
                        allIDs = allIDs.substring(0, allIDs.length - 1);
                        let idArray = [];
                        let ind = 0;
                        while (ind < allIDs.length && ind !== -1) {
                            ind = allIDs.indexOf(" ", ind);
                            let nextInd = allIDs.indexOf(" ", ind + 2);
                            if (nextInd === -1) {
                                nextInd = allIDs.length;
                            }
                            let sub = allIDs.substring(ind + 1, nextInd);
                            idArray.push(sub);
                            ind = allIDs.indexOf(" ", ind + 1);
                        }
                        let insightDataHelper = new InsightDataHelper_1.InsightDataHelper();
                        let datasetToAdd = insightDataHelper.createInsightDataset(id, kind, sectionsArray.length);
                        if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                            let oldDatasets = fs.readFileSync("./data/" + "datasets" + ".txt", "utf-8");
                            let jsonObj = JSON.parse(oldDatasets);
                            let arrayOfDatasets = jsonObj;
                            arrayOfDatasets.push(datasetToAdd);
                            let newJsonObj = JSON.stringify(arrayOfDatasets);
                            fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                            let arrayOfNames = [];
                            for (let dset of arrayOfDatasets) {
                                arrayOfNames.push(dset.id);
                            }
                            fulfill(arrayOfNames);
                        }
                        else {
                            let arrayOfDatasets = [];
                            arrayOfDatasets.push(datasetToAdd);
                            let newJsonObj = JSON.stringify(arrayOfDatasets);
                            fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                            let arrayOfNames = [];
                            for (let dset of arrayOfDatasets) {
                                arrayOfNames.push(dset.id);
                            }
                            fulfill(arrayOfNames);
                        }
                    });
                }).catch(function (error) {
                    return reject(new IInsightFacade_1.InsightError("loadAsync is not working"));
                });
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                if (!fs.existsSync("./data/")) {
                    fs.mkdirSync("./data/");
                }
                if (content === undefined || content === null || content === "") {
                    return reject(new IInsightFacade_1.InsightError("cannot be null, undefined, or empty string as content"));
                }
                if (id === undefined || id === null || id === "") {
                    return reject(new IInsightFacade_1.InsightError("cannot be null, undefined, or empty string as id"));
                }
                if (fs.existsSync("./data/" + "added" + ".txt")) {
                    let idCheckArray = fs.readFileSync("./data/added.txt", "utf-8");
                    if (idCheckArray.includes(" " + id + " ")) {
                        return reject(new IInsightFacade_1.InsightError("dataset id already exists"));
                    }
                }
                zip.loadAsync(content, { base64: true }).then(function (result) {
                    zip = result;
                    let roomsArray = [];
                    let buildHelper = new BuildingHelper_1.BuildingHelper();
                    zip.file("index.htm").async("string").then(function (data) {
                        let roomsData = data;
                        let trArray;
                        let parsedHTML = parse5.parse(roomsData);
                        trArray = buildHelper.getTrElements(parsedHTML, "table", "class", "views-table cols-5 table", "tbody");
                        let tbody = trArray;
                        buildHelper.getBuildings(tbody).then(function (arrayOfBs) {
                            let arrayOfBuildings = arrayOfBs;
                            let promBuildingArray = [];
                            for (let building of arrayOfBuildings) {
                                promBuildingArray.push(zip.file(building.href.substring(2, building.href.length))
                                    .async("string"));
                            }
                            Promise.all(promBuildingArray).then(function (results) {
                                let allRooms = [];
                                let index = 0;
                                let arrayOfRoomsInBuild = [];
                                for (let buildingFile of results) {
                                    let parsedRoomHTML = parse5.parse(buildingFile);
                                    let trRoomArray = buildHelper.getTrElements(parsedRoomHTML, "table", "class", "views-table cols-5 table", "tbody");
                                    if (trRoomArray !== false) {
                                        let arrayOfRooms = buildHelper.getRoomData(trRoomArray, arrayOfBuildings[index].shortName, arrayOfBuildings[index].fullName, arrayOfBuildings[index].address, arrayOfBuildings[index].lat, arrayOfBuildings[index].lon);
                                        for (let room of arrayOfRooms) {
                                            allRooms.push(room);
                                        }
                                    }
                                    index++;
                                }
                                if (allRooms.length === 0) {
                                    return reject(new IInsightFacade_1.InsightError("no valid rooms in this room dataset!"));
                                }
                                that.datasetMap[id] = allRooms;
                                let toStoreDatasetMap = JSON.stringify(allRooms);
                                fs.writeFileSync("./data/" + id + ".txt", toStoreDatasetMap);
                                let addedExists = fs.existsSync("./data/added.txt");
                                let allIDs;
                                if (addedExists) {
                                    let oldIDs = fs.readFileSync("./data/added.txt", "utf-8");
                                    allIDs = oldIDs + id + " ";
                                }
                                else {
                                    allIDs = " " + id + " ";
                                }
                                fs.writeFileSync("./data/" + "added" + ".txt", allIDs);
                                allIDs = allIDs.substring(0, allIDs.length - 1);
                                let idArray = [];
                                let ind = 0;
                                while (ind < allIDs.length && ind !== -1) {
                                    ind = allIDs.indexOf(" ", ind);
                                    let nextInd = allIDs.indexOf(" ", ind + 2);
                                    if (nextInd === -1) {
                                        nextInd = allIDs.length;
                                    }
                                    let sub = allIDs.substring(ind + 1, nextInd);
                                    idArray.push(sub);
                                    ind = allIDs.indexOf(" ", ind + 1);
                                }
                                let insightDataHelper = new InsightDataHelper_1.InsightDataHelper();
                                let datasetToAdd = insightDataHelper.createInsightDataset(id, kind, allRooms.length);
                                if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                                    let oldDatasets = fs.readFileSync("./data/" + "datasets" + ".txt", "utf-8");
                                    let jsonObj = JSON.parse(oldDatasets);
                                    let arrayOfDatasets = jsonObj;
                                    arrayOfDatasets.push(datasetToAdd);
                                    let newJsonObj = JSON.stringify(arrayOfDatasets);
                                    fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                    let arrayOfNames = [];
                                    for (let dset of arrayOfDatasets) {
                                        arrayOfNames.push(dset.id);
                                    }
                                    fulfill(arrayOfNames);
                                }
                                else {
                                    let arrayOfDatasets = [];
                                    arrayOfDatasets.push(datasetToAdd);
                                    let newJsonObj = JSON.stringify(arrayOfDatasets);
                                    fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                                    let arrayOfNames = [];
                                    for (let dset of arrayOfDatasets) {
                                        arrayOfNames.push(dset.id);
                                    }
                                    let arrayId = arrayOfNames;
                                    fulfill(arrayOfNames);
                                }
                            }).catch(function (err) {
                                reject(new IInsightFacade_1.InsightError(err));
                            });
                        }).catch(function (err) {
                            reject(err);
                        });
                    }).catch(function (error) {
                        return reject(new IInsightFacade_1.InsightError("parse5 error"));
                    });
                });
            }
            else {
                return reject(new IInsightFacade_1.InsightError("invalid kind"));
            }
        });
    }
    removeDataset(id) {
        let that = this;
        return new Promise(function (fulfill, reject) {
            if (id === undefined || id === null || id === "") {
                return reject(new IInsightFacade_1.InsightError("null, undefined, empty string ids are not permitted"));
            }
            if (!fs.existsSync("./data/added.txt")) {
                return reject(new IInsightFacade_1.InsightError("added id's file has been removed cannot continue"));
            }
            else {
                let idCheckString = fs.readFileSync("./data/added.txt", "utf-8");
                if (!idCheckString.includes(" " + id + " ")) {
                    return reject(new IInsightFacade_1.NotFoundError("this id was not a added dataset"));
                }
                else {
                    let trimmedCheckString = idCheckString.replace(" " + id + " ", " ");
                    fs.writeFileSync("./data/added.txt", trimmedCheckString);
                    fs.unlinkSync("./data/" + id + ".txt");
                    delete that.datasetMap[id];
                    let map = that.datasetMap;
                    let oldDatasets = fs.readFileSync("./data/" + "datasets" + ".txt", "utf-8");
                    let arrayOfDatasets = JSON.parse(oldDatasets);
                    for (let x = 0; x < arrayOfDatasets.length; x++) {
                        if (arrayOfDatasets[x].id === id) {
                            arrayOfDatasets.splice(x, 1);
                            let newArrayOfDatasets = arrayOfDatasets;
                            let newJsonObj = JSON.stringify(newArrayOfDatasets);
                            fs.writeFileSync("./data/" + "datasets" + ".txt", newJsonObj);
                        }
                    }
                    fulfill(id);
                }
            }
        });
    }
    performQuery(query) {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let currentDatasetId = "";
            let syntaxhelper = new SyntaxHelpers_1.SyntaxHelpers();
            let whereFlag = false;
            let optionsFlag = false;
            let transFlag = false;
            let transValidity = false;
            let whereValidity = false;
            let optionsValidity = false;
            let applyKeys = null;
            for (let key in query) {
                if (key === "WHERE") {
                    if (!whereFlag) {
                        whereValidity = syntaxhelper.checkSyntax(query[key], key);
                        if (!whereValidity) {
                            return reject(new IInsightFacade_1.InsightError("Body format is incorrect"));
                        }
                        whereFlag = true;
                    }
                    else {
                        return reject(new IInsightFacade_1.InsightError("Multiple bodies or options"));
                    }
                }
                else if (key === "OPTIONS") {
                    if (!optionsFlag) {
                        optionsValidity = syntaxhelper.checkOptionsSyntax(query[key], key);
                        if (!optionsValidity) {
                            return reject(new IInsightFacade_1.InsightError("Options not valid"));
                        }
                        optionsFlag = true;
                    }
                    else {
                        return reject(new IInsightFacade_1.InsightError("Multiple bodies or options"));
                    }
                }
                else if (key === "TRANSFORMATIONS") {
                    if (!transFlag) {
                        transValidity = syntaxhelper.checkTransformSyntax(query[key]);
                        if (!transValidity) {
                            return reject(new IInsightFacade_1.InsightError("Trans not valid"));
                        }
                        transFlag = true;
                    }
                    else {
                        return reject(new IInsightFacade_1.InsightError("Multiple bodies or options"));
                    }
                }
                else {
                    return reject(new IInsightFacade_1.InsightError("Outer Key Not Options nor Where"));
                }
            }
            for (let obj of syntaxhelper.returnApplyKeys()) {
                if (!obj["seen"]) {
                    return reject(new IInsightFacade_1.InsightError("ApplyKey in Column not seen in Apply Options"));
                }
            }
            Util_1.default.trace("now both are valid");
            Util_1.default.info("and we wanna continue");
            Util_1.default.test("are we sure?");
            Util_1.default.error("get in");
            Util_1.default.warn("jajajajajajaja");
            let parser = new ParseQueryHelper_1.ParseQueryHelper();
            let filter = parser.parseQuery(query["WHERE"]);
            let option = parser.parseOptions(query["OPTIONS"]);
            let transformFilter = null;
            if (transFlag) {
                transformFilter = parser.parseTransform(query["TRANSFORMATIONS"]);
            }
            currentDatasetId = syntaxhelper.returnCurrentDatasetID();
            let resultHelper = new ResultHelper_1.ResultHelper();
            let results;
            if (Object.keys(that.datasetMap).includes(currentDatasetId)) {
                let dataArray = that.datasetMap[currentDatasetId];
                results = resultHelper.getResultsArray(dataArray, filter, option, transformFilter);
                if (results === false) {
                    return reject(new IInsightFacade_1.InsightError("more than 5000 valid sections"));
                }
            }
            else {
                if (fs.existsSync("./data/" + currentDatasetId + ".txt")) {
                    let dataFromMem = fs.readFileSync("./data/" + currentDatasetId + ".txt", "utf-8");
                    let arrayOfObjects = JSON.parse(dataFromMem);
                    results = resultHelper.getResultsArray(arrayOfObjects, filter, option, transformFilter);
                    if (results === false) {
                        return reject(new IInsightFacade_1.InsightError("more than 5000 valid sections"));
                    }
                }
                else {
                    return reject(new IInsightFacade_1.InsightError("query dataset does not exist"));
                }
            }
            return fulfill(results);
        });
    }
    listDatasets() {
        return new Promise(function (fulfill, reject) {
            if (fs.existsSync("./data/" + "datasets" + ".txt")) {
                let dataFromDatasets = fs.readFileSync("./data/datasets.txt", "utf-8");
                let parsedDataFromDatasets = JSON.parse(dataFromDatasets);
                fulfill(parsedDataFromDatasets);
            }
            else {
                fulfill([]);
            }
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map