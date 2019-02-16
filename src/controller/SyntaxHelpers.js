"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SyntaxHelpers {
    constructor() {
        this.alreadyWhere = false;
        this.alreadyOptions = false;
        this.alreadyTransform = false;
        this.dataset = null;
        this.columns = [];
        this.groups = [];
        this.isCourse = null;
        this.columnApplyKeys = [];
    }
    checkSyntax(query, key) {
        if (key === "WHERE") {
            if (typeof query !== "object" || Array.isArray(query) || this.alreadyWhere) {
                return false;
            }
            else {
                this.alreadyWhere = true;
                for (let key1 in query) {
                    if (!this.checkSyntax(query[key1], key1)) {
                        return false;
                    }
                }
                return true;
            }
        }
        switch (key) {
            case "AND":
                if (Array.isArray(query) && query.length > 0) {
                    for (let comparatorQuery of query) {
                        for (let key2 in comparatorQuery) {
                            if (!this.checkSyntax(comparatorQuery[key2], key2)) {
                                return false;
                            }
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case "OR":
                if (Array.isArray(query) && query.length > 0) {
                    for (let comparatorQuery of query) {
                        for (let key2 in comparatorQuery) {
                            if (!this.checkSyntax(comparatorQuery[key2], key2)) {
                                return false;
                            }
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case "LT":
                if (typeof query !== "object" || Array.isArray(query) || Object.keys(query).length !== 1) {
                    return false;
                }
                for (let key3 in query) {
                    if (typeof key3 === "string") {
                        if (!this.terminatingKeyNum(key3)) {
                            return false;
                        }
                        if (typeof query[key3] !== "number") {
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return false;
                    }
                }
                break;
            case "GT":
                if (typeof query !== "object" || Array.isArray(query) || Object.keys(query).length !== 1) {
                    return false;
                }
                for (let key3 in query) {
                    if (typeof key3 === "string") {
                        if (!this.terminatingKeyNum(key3)) {
                            return false;
                        }
                        if (typeof query[key3] !== "number") {
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return false;
                    }
                }
                break;
            case "EQ":
                if (typeof query !== "object" || Array.isArray(query) || Object.keys(query).length !== 1) {
                    return false;
                }
                for (let key3 in query) {
                    if (typeof key3 === "string") {
                        if (!this.terminatingKeyNum(key3)) {
                            return false;
                        }
                        if (typeof query[key3] !== "number") {
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return false;
                    }
                }
                break;
            case "IS":
                if (typeof query !== "object" || Array.isArray(query) || Object.keys(query).length !== 1) {
                    return false;
                }
                for (let key3 in query) {
                    if (typeof query[key3] !== "string") {
                        return false;
                    }
                    if (typeof key3 === "string") {
                        if (!this.terminatingKeyString(key3, query)) {
                            return false;
                        }
                    }
                    else {
                        return false;
                    }
                }
                break;
            case "NOT":
                if (typeof query !== "object" || Array.isArray(query) || Object.keys(query).length !== 1) {
                    return false;
                }
                for (let key1 in query) {
                    if (!this.checkSyntax(query[key1], key1)) {
                        return false;
                    }
                }
                break;
            default:
                return false;
        }
        return true;
    }
    checkOptionsSyntax(query, key) {
        let columnsGuard = false;
        let orderGuard = false;
        let transGuard = false;
        if (key === "OPTIONS") {
            if (typeof query !== "object" || Array.isArray(query) || this.alreadyOptions) {
                return false;
            }
            if (Object.keys(query).length === 0) {
                return false;
            }
            this.alreadyOptions = true;
            for (let key1 in query) {
                if (key1 === "COLUMNS") {
                    if (!columnsGuard && !orderGuard && !transGuard) {
                        columnsGuard = true;
                        if (!Array.isArray(query[key1])) {
                            return false;
                        }
                        if (query[key1].length === 0) {
                            return false;
                        }
                        for (let i of query[key1]) {
                            if (!this.terminatingOptions(i)) {
                                if (i.indexOf("_") !== -1) {
                                    return false;
                                }
                                else {
                                    this.columnApplyKeys.push({ name: i, seen: false });
                                    this.columns.push(i);
                                }
                            }
                            else {
                                this.columns.push(i);
                            }
                        }
                    }
                    else {
                        return false;
                    }
                }
                else if (key1 === "ORDER") {
                    if (!orderGuard && columnsGuard && !transGuard) {
                        orderGuard = true;
                        if (typeof query[key1] === "string" && this.columns.includes(query[key1])) {
                            if (!this.terminatingOptions(query[key1])) {
                                if (query[key1].indexOf("_") !== -1) {
                                    return false;
                                }
                                if (!this.columns.includes(query[key1])) {
                                    return false;
                                }
                            }
                        }
                        else if (typeof query[key1] === "object") {
                            let orderKeys = Object.keys(query[key1]);
                            if (orderKeys.length === 2 && orderKeys[0] === "dir" && orderKeys[1] === "keys") {
                                if (query[key1]["dir"] === "UP" || query[key1]["dir"] === "DOWN") {
                                    if (Array.isArray(query[key1]["keys"]) && query[key1]["keys"].length > 0) {
                                        for (let key2 of query[key1]["keys"]) {
                                            if (!this.columns.includes(key2)) {
                                                return false;
                                            }
                                            let validity = this.terminatingOptions(key2);
                                            if (!validity) {
                                                if (key2.indexOf("_") !== -1) {
                                                    return false;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        return false;
                                    }
                                }
                                else {
                                    return false;
                                }
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    checkTransformSyntax(query) {
        let groupGuard = false;
        let applyGuard = false;
        let alreadyGroup = false;
        let alreadyApply = false;
        this.alreadyTransform = true;
        for (let key1 in query) {
            if (key1 === "GROUP") {
                if (!groupGuard) {
                    groupGuard = true;
                    if (Array.isArray(query["GROUP"]) && query["GROUP"].length > 0 && alreadyGroup === false) {
                        alreadyGroup = true;
                        for (let group of query["GROUP"]) {
                            let validity = this.terminatingOptions(group);
                            if (!validity) {
                                return false;
                            }
                            this.groups.push(group);
                        }
                        for (let col of this.columns) {
                            if (col.indexOf("_") !== -1) {
                                if (!this.groups.includes(col)) {
                                    return false;
                                }
                            }
                        }
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            else if (key1 === "APPLY") {
                if (!applyGuard) {
                    applyGuard = true;
                    if (Array.isArray(query["APPLY"]) && alreadyApply === false) {
                        alreadyApply = true;
                        for (let applyObject of query["APPLY"]) {
                            if (!this.checkApplyObject(applyObject)) {
                                return false;
                            }
                            if (!this.checkInnerApply(applyObject)) {
                                return false;
                            }
                        }
                        for (let obj of this.columnApplyKeys) {
                            if (!obj["seen"]) {
                                return false;
                            }
                        }
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        return true;
    }
    checkApplyObject(applyObject) {
        let keyArray = Object.keys(applyObject);
        for (let key of keyArray) {
            for (let obj of this.columnApplyKeys) {
                if (obj["name"] === key) {
                    if (obj["seen"] === true) {
                        return false;
                    }
                    else {
                        obj["seen"] = true;
                    }
                }
            }
        }
        return true;
    }
    checkInnerApply(applyObject) {
        let keyArray = Object.keys(applyObject);
        for (let key of keyArray) {
            let innerObject = applyObject[key];
            let innerKeyArray = Object.keys(innerObject);
            for (let innerKey of innerKeyArray) {
                switch (innerKey) {
                    case "AVG":
                        if (!this.terminatingKeyNum(innerObject[innerKey])) {
                            return false;
                        }
                        break;
                    case "MAX":
                        if (!this.terminatingKeyNum(innerObject[innerKey])) {
                            return false;
                        }
                        break;
                    case "MIN":
                        if (!this.terminatingKeyNum(innerObject[innerKey])) {
                            return false;
                        }
                        break;
                    case "COUNT":
                        if (!this.terminatingKeyNum(innerObject[innerKey])) {
                            if (!this.terminatingKeyString(innerObject[innerKey], "dummy value")) {
                                return false;
                            }
                        }
                        break;
                    case "SUM":
                        if (!this.terminatingKeyNum(innerObject[innerKey])) {
                            return false;
                        }
                        break;
                    default:
                        return false;
                }
            }
        }
        return true;
    }
    terminatingKeyNum(key) {
        let underPos = key.indexOf("_");
        if (underPos === -1) {
            return false;
        }
        if (this.dataset !== null) {
            let keyDataset = key.substring(0, underPos);
            if (keyDataset !== this.dataset) {
                return false;
            }
        }
        else {
            this.dataset = key.substring(0, underPos);
        }
        let queryKey = key.substring(underPos + 1, key.length);
        switch (queryKey) {
            case "avg":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "pass":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "fail":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "audit":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "year":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "lat":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "lon":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "seats":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            default:
                return false;
        }
        return true;
    }
    terminatingKeyString(key, query) {
        let underPos = key.indexOf("_");
        if (underPos === -1) {
            return false;
        }
        if (this.dataset !== null) {
            let keyDataset = key.substring(0, underPos);
            if (keyDataset !== this.dataset) {
                return false;
            }
        }
        else {
            this.dataset = key.substring(0, underPos);
        }
        let queryKey = key.substring(underPos + 1, key.length);
        let stringVal = query[key];
        if (stringVal.indexOf("*", 1) !== stringVal.length - 1 &&
            stringVal.indexOf("*", 1) !== -1) {
            return false;
        }
        switch (queryKey) {
            case "dept":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "id":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "instructor":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "title":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "uuid":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "fullname":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "shortname":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "number":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "name":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "address":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "type":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "furniture":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "href":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "lat":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "lon":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "seats":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            default:
                return false;
        }
        return true;
    }
    terminatingOptions(column) {
        let underPos = column.indexOf("_");
        if (underPos === -1) {
            return false;
        }
        let keyDataset = column.substring(0, underPos);
        if (this.dataset === null) {
            this.dataset = keyDataset;
        }
        if (keyDataset !== this.dataset) {
            return false;
        }
        let queryKey = column.substring(underPos + 1, column.length);
        switch (queryKey) {
            case "dept":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "id":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "instructor":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "title":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "uuid":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "avg":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "pass":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "fail":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "audit":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "year":
                if (!this.checkIsCourse(true)) {
                    return false;
                }
                break;
            case "fullname":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "shortname":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "number":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "name":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "address":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "type":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "furniture":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "href":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "lat":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "lon":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            case "seats":
                if (!this.checkIsCourse(false)) {
                    return false;
                }
                break;
            default:
                return false;
        }
        return true;
    }
    returnCurrentDatasetID() {
        return this.dataset;
    }
    returnApplyKeys() {
        return this.columnApplyKeys;
    }
    checkIsCourse(expected) {
        if (this.isCourse === null) {
            this.isCourse = expected;
            return true;
        }
        else if (this.isCourse !== expected) {
            return false;
        }
        else {
            return true;
        }
    }
}
exports.SyntaxHelpers = SyntaxHelpers;
//# sourceMappingURL=SyntaxHelpers.js.map