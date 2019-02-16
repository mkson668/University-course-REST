import {IFilter} from "./IFilter";

export class ParseQueryHelper {
    // private classFilter: IFilter;
    constructor() {
        // this.arrayOfFilters = [];
    }

    public parseQuery(innerQuery: any): IFilter {
        for (let filter in innerQuery) {
            switch (filter) {
                case "AND":
                    let andFilter: IFilter = {type: "AND", andArray: []};
                    for (let element of innerQuery[filter]) {
                        andFilter.andArray.push(this.parseQuery(element));
                    }
                    return andFilter;
                case "OR":
                    let orFilter: IFilter = {type: "OR", orArray: []};
                    for (let element of innerQuery[filter]) {
                        orFilter.orArray.push(this.parseQuery(element));
                    }
                    return orFilter;
                case "NOT":
                    let notFilter: IFilter = {type: "NOT", notObject: {type: "UNDEFINED"}};
                    notFilter.notObject = this.parseQuery(innerQuery["NOT"]);
                    return notFilter;
                case "GT":
                    let gtFilter: IFilter = {type: "GT", key: "", num: -1};
                    for (let sought in innerQuery["GT"]) {
                    let extendedKey: string = sought;
                    let underPos = extendedKey.indexOf("_");
                    gtFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                    gtFilter.num = innerQuery["GT"][sought];
                    }
                    return gtFilter;
                case "LT":
                    let ltFilter: IFilter = {type: "LT", key: "", num: -1};
                    for (let sought in innerQuery["LT"]) {
                        let extendedKey: string = sought;
                        let underPos = extendedKey.indexOf("_");
                        ltFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        ltFilter.num = innerQuery["LT"][sought];
                    }
                    return ltFilter;
                case "EQ":
                    let eqFilter: IFilter = {type: "EQ", key: "", num: -1};
                    for (let sought in innerQuery["EQ"]) {
                        let extendedKey: string = sought;
                        let underPos = extendedKey.indexOf("_");
                        eqFilter.key = extendedKey.substring(underPos + 1, extendedKey.length);
                        eqFilter.num = innerQuery["EQ"][sought];
                    }
                    return eqFilter;
                case "IS":
                    let isFilter: IFilter = {type: "IS", key: "", isVal: ""};
                    for (let sought in innerQuery["IS"]) {
                        let extendedKey: string = sought;
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

    public parseOptions(innerQuery: any): object {
        let optionsFilter: any = {columns: [], order: null};   // order can be a string or an object
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

    public parseTransform(innerQuery: any): object {
        let transFilter: any = {group: [], apply: []};
        for (let key in innerQuery) {
            switch (key) {
                case "GROUP":
                    for (let value of innerQuery["GROUP"]) {   // just simple string keys
                        transFilter.group.push(value);
                    }
                    break;
                case "APPLY":
                    for (let value of innerQuery["APPLY"]) {  // object with one field that is also an object
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
