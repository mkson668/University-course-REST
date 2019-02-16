"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParseQueryHelper {
    constructor() {
    }
    parseQuery(innerQuery) {
        for (let filter in innerQuery) {
            switch (filter) {
                case "AND":
                    let andFilter = { type: "AND", andArray: [] };
                    for (let element of innerQuery[filter]) {
                        andFilter.andArray.push(this.parseQuery(element));
                    }
                    return andFilter;
                case "OR":
                    let orFilter = { type: "OR", orArray: [] };
                    for (let element of innerQuery[filter]) {
                        orFilter.orArray.push(this.parseQuery(element));
                    }
                    return orFilter;
                case "NOT":
                    let notFilter = { type: "NOT", notObject: { type: "UNDEFINED" } };
                    notFilter.notObject = this.parseQuery(innerQuery["NOT"]);
                    return notFilter;
                case "GT":
                    let gtFilter = { type: "GT", key: "", num: -1 };
                    for (let sought in innerQuery["GT"]) {
                        let extendedKey = sought;
                        let underPos = extendedKey.indexOf("_");
                        gtFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        gtFilter.num = innerQuery["GT"][sought];
                    }
                    return gtFilter;
                case "LT":
                    let ltFilter = { type: "LT", key: "", num: -1 };
                    for (let sought in innerQuery["LT"]) {
                        let extendedKey = sought;
                        let underPos = extendedKey.indexOf("_");
                        ltFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        ltFilter.num = innerQuery["LT"][sought];
                    }
                    return ltFilter;
                case "EQ":
                    let eqFilter = { type: "EQ", key: "", num: -1 };
                    for (let sought in innerQuery["EQ"]) {
                        let extendedKey = sought;
                        let underPos = extendedKey.indexOf("_");
                        eqFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        eqFilter.num = innerQuery["EQ"][sought];
                    }
                    return eqFilter;
                case "IS":
                    let isFilter = { type: "IS", key: "", isVal: "" };
                    for (let sought in innerQuery["IS"]) {
                        let extendedKey = sought;
                        let underPos = extendedKey.indexOf("_");
                        isFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        isFilter.isVal = innerQuery["IS"][sought];
                    }
                    return isFilter;
                default:
                    break;
            }
        }
    }
    parseOptions(innerQuery) {
        let optionsFilter = { columns: [], order: null };
        for (let key in innerQuery) {
            switch (key) {
                case "COLUMNS":
                    for (let value of innerQuery["COLUMNS"]) {
                        optionsFilter.columns.push(value);
                    }
                    break;
                case "ORDER":
                    optionsFilter.order = innerQuery["ORDER"];
                    break;
                default:
                    break;
            }
        }
        return optionsFilter;
    }
    parseTransform(innerQuery) {
        let transFilter = { group: [], apply: [] };
        for (let key in innerQuery) {
            switch (key) {
                case "GROUP":
                    for (let value of innerQuery["GROUP"]) {
                        transFilter.group.push(value);
                    }
                    break;
                case "APPLY":
                    for (let value of innerQuery["APPLY"]) {
                        transFilter.apply.push(value);
                    }
                    break;
                default:
                    break;
            }
        }
        return transFilter;
    }
}
exports.ParseQueryHelper = ParseQueryHelper;
//# sourceMappingURL=ParseQueryHelper.js.map