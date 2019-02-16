import {IFilter} from "./IFilter";
import {Section} from "./Section";
import Decimal from "decimal.js";
import Log from "../Util";

export class ResultHelper {
    private tempSections: Section[];
    private resultSections: any;
    private finalGroupedArray: any[];
    private isGrouped: boolean = false;
    private allAppliedKeys: any[];
    private keyArrayIndex: number;
    constructor() {
        this.tempSections = [];
        this.resultSections = [];
        this.finalGroupedArray = [];
        this.allAppliedKeys = [];
        this.keyArrayIndex = 0;
    }

    public getResultsArray(sectionsArray: any[], filter: IFilter, option: any, trans: any): any {
        for (let section of sectionsArray) {
            if (this.getResults(section, filter)) {
                this.tempSections.push(section);
            }
        }
        let resultsColumn: any[] = this.parseSectionsByColumns(this.tempSections, option, trans);
        if (trans === null) {                   // don't do grouping and don't do apply keys
            return this.order(resultsColumn, option);
        }
        let grouped2DResult: any[] = this.groupPartitioner(resultsColumn, trans, 0);
        let appliedAndFlattened: any[] = this.applyAndFlatten(this.finalGroupedArray, trans);
        let resultsColumnAndOrder: any[] = this.sortResults(appliedAndFlattened, option);
        // Order and columns
        return resultsColumnAndOrder;
    }

    public groupPartitioner(origArray: any[], trans: any, i: number): any[] {
        if (i >= trans["group"].length) {
            this.finalGroupedArray.push(origArray);
            this.isGrouped = true;
            return origArray;
        }
        let categorizer: any = trans["group"][i];
        let groupedArray: any[] = []; // 2d intermediate
        let groupedArrayFlattened: any[] = []; // final flattened array
        let newOrigArray: any[] = origArray;
        while (newOrigArray.length > 0) {
            let updateOrig: any[] = [];
            let elementOfNew: any[] = [];
            let matchTo: any = newOrigArray[0][categorizer];
            for (let section of newOrigArray) {
                if (section[categorizer] === matchTo) {
                    elementOfNew.push(section);
                } else {
                    updateOrig.push(section);
                }
            }
            groupedArray.push(elementOfNew);
            newOrigArray = updateOrig;
        }

        // this.finalGroupedArray = groupedArray;
        /*
        for (let ind: number = 0; ind < groupedArray.length; ++ind) {
            let subs: any[] = this.groupPartitioner(groupedArray[ind], trans, i + 1);
            Log.trace("ind");
        }*/
        let ind: number = 0;
        while (ind < groupedArray.length) {
            let subs: any[] = this.groupPartitioner(groupedArray[ind], trans, i + 1);
            ++ind;
        }

        /*
        // flatten grouped Array
        for (let array of groupedArray) {
            for (let element of array) {
                groupedArrayFlattened.push(element);
            }
        }*/

        // this.finalGroupedArray = groupedArray;
        return;
    }

    public applyAndFlatten(arrayToApply: any[], trans: any): any {
        // let howManyGroups: number = arrayToApply.length - 1;
        let lastKey: number = trans.apply.length - 1;
        let counter: number = 0;
        let finalArray: any[] = [];
        let currSection: any = null;
        for (let oneDArray of arrayToApply) {
            counter = 0;
            for (let applyKey of trans.apply) {
                for (let key in applyKey) {
                    for (let innerKey in applyKey[key]) {
                        switch (innerKey) {
                            case "MAX":
                                let currMax: any = null;
                                for (let section of oneDArray) {
                                    if (currMax === null) {
                                        currMax = section[key];
                                        currSection = section;
                                    } else {
                                        if (section[key] > currMax) {
                                            currMax = section[key];
                                            currSection = section;
                                        }
                                    }
                                }
                                if (counter === lastKey) {
                                    finalArray.push(currSection);
                                }
                                counter++;
                                break;
                            case "MIN":
                                let currMin: any = null;
                                for (let section of oneDArray) {
                                    if (currMin === null) {
                                        currMin = section[key];
                                        currSection = section;
                                    } else {
                                        if (section[key] < currMin) {
                                            currMin = section[key];
                                            currSection = section;
                                        }
                                    }
                                }
                                if (counter === lastKey) {
                                    finalArray.push(currSection);
                                }
                                counter++;
                                break;
                            case "COUNT":
                                // let onlyUniqueArray: any[] = Array.from(new Set(oneDArray)); // citation from SOF
                                let len: any = this.unique(oneDArray, key);
                                oneDArray[0][key] = len.length;
                                if (counter === lastKey) {
                                    finalArray.push(oneDArray[0]);
                                }
                                counter++;
                                break;
                            case "AVG":
                                let acc1: any = new Decimal(0);
                                let avg: any = new Decimal(0);
                                for (let section of oneDArray) {
                                    acc1 = acc1.add(new Decimal(section[key]));
                                }
                                avg = acc1.toNumber() / oneDArray.length;
                                avg = Number(avg.toFixed(2));
                                oneDArray[0][key] = avg;
                                if (counter === lastKey) {
                                    finalArray.push(oneDArray[0]);
                                }
                                counter++;
                                break;
                            case "SUM":
                                let acc2: any = new Decimal(0);
                                for (let section of oneDArray) {
                                    acc2 = acc2.add(new Decimal(section[key]));
                                }
                                acc2 = Number(acc2.toFixed(2));
                                oneDArray[0][key] = acc2;
                                if (counter === lastKey) {
                                    finalArray.push(oneDArray[0]);
                                }
                                counter++;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
            /*if (counter === howManyGroups && trans.apply.length > 1) {
                trans.apply.splice(0);
                return this.applyAndFlatten(finalArray, trans);
            }*/
        }
        return finalArray;
    }

    public unique(arr: any, key: any): any[] { // taken from stackoverflow
        let unique: any = {};
        let distinct: any = [];
        for (let i in arr) {
            if (typeof(unique[arr[i][key]]) === "undefined") {
                distinct.push(arr[i][key]);
            }
            unique[arr[i][key]] = 0;
        }
        return distinct;
    }

    public sortResults(sectionsArray: any[], option: any): any {
        if (sectionsArray.length > 5000) {
            return false;
        }
        let order: any = option["order"];
        if (order === null || order === "") {
            return sectionsArray;
        }
        if (typeof order === "object") {
            let direction: string = order.dir;
            let keysArray: any[] = order.keys;
            let arrayToDirection: any[] = [];
            if (keysArray.length === 1) {
                arrayToDirection = this.singleSortHelper(sectionsArray, keysArray[0]);
                if (direction === "DOWN") {
                    let reversedArray: any[] = [];
                    for (let i = arrayToDirection.length - 1; i >= 0; --i) {
                        reversedArray.push(arrayToDirection[i]);
                    }
                    arrayToDirection = reversedArray;
                }
            } else if (keysArray.length > 1) {
                arrayToDirection = this.multipleSortHelper(sectionsArray, keysArray, option);
                arrayToDirection = this.flattenDeep(arrayToDirection);
            } else {
                arrayToDirection = sectionsArray;
            }
            return arrayToDirection;
        }
        return this.singleSortHelper(sectionsArray, order);
    }

    public multipleSortHelper(sectionsArray: any[], orderKeys: any[], option: any): any[] {
        if (orderKeys.length === this.keyArrayIndex || sectionsArray.length === 1) {
            return sectionsArray;
        }
        let direction: string = option.order.dir;
        sectionsArray = this.singleSortHelper(sectionsArray, orderKeys[this.keyArrayIndex]);
        if (direction === "DOWN") {
            let reversedArray: any[] = [];
            for (let i = sectionsArray.length - 1; i >= 0; --i) {
                reversedArray.push(sectionsArray[i]);
            }
            sectionsArray = reversedArray;
        }
        let index: number = 0;
        let instancesArray: number[] = [];
        while (index < sectionsArray.length) {
            let tieValue: any = sectionsArray[index][orderKeys[this.keyArrayIndex]];
            let amountOfInstances: number = 1;
            let matches: boolean = true;
            while (matches) {
                index++;
                if (index >= sectionsArray.length) {
                    instancesArray.push(amountOfInstances);
                    matches = false;
                    break;
                } else {
                    if (sectionsArray[index][orderKeys[this.keyArrayIndex]] === tieValue) {
                        amountOfInstances++;
                    } else {
                        instancesArray.push(amountOfInstances);
                        matches = false;
                        break;
                    }
                }
            }
        }
        // Splice orderKey[0]
        let newOuterArray: any[] = [];
        let indexOfSectionsArray = 0;
        for (let occurrences of instancesArray) {     // array or object?
            let newInnerArray: any[] = [];
            let copyOrderKeys: any[] = orderKeys;
            this.keyArrayIndex = 0;
            /*while (occurrences >= 0) {
                if (occurrences === 0) {
                    newOuterArray.push(newInnerArray);
                    break;
                }*/
            while (occurrences > 0) {
                newInnerArray.push(sectionsArray[indexOfSectionsArray]);
                indexOfSectionsArray++;
                occurrences--;
            }
            this.keyArrayIndex++;
            let recursiveInner: any[] = this.multipleSortHelper(newInnerArray, copyOrderKeys, option);
            newOuterArray.push(recursiveInner);
        }
        return newOuterArray;
    }

    public flattenDeep(arr1: any[]): any {   // from stackoverflow
        return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(this.flattenDeep(val)) : acc.concat(val), []);
    }

    public singleSortHelper(sectionsArray: any[], orderKey: any): any {
        let result: any = [];
        let shortOrderValue: string;
        let underPos: number = orderKey.indexOf("_");
        if (underPos !== -1) {
            shortOrderValue = orderKey.substring(underPos + 1, orderKey.length);
        }
        switch (shortOrderValue) {
            case "avg":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "pass":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "fail":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "audit":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "year":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "dept":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "id":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "instructor":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "title":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "uuid":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "fullname":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "shortname":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "number":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "name":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "address":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "lat":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "lon":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "seats":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "type":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "furniture":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            case "href":
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
            default:
                result = this.bubbleSortSectionsArray(sectionsArray, orderKey);
                break;
        }
        return result;
    }

    public bubbleSortSectionsArray(sectionsArray: any[], orderBy: string): any[] {
        let length: number = sectionsArray.length;
        let tempSectionsArray: any = sectionsArray;
        for (let x = 1; x < length; x++) {
            for (let j = x; j >= 1; j--) {
                let tempSectionJ: any = tempSectionsArray[j][orderBy];
                let tempSectionJminus1: any = tempSectionsArray[j - 1][orderBy];
                if (tempSectionJ < tempSectionJminus1) {
                    let temp: Section = sectionsArray[j];
                    sectionsArray[j] = sectionsArray [j - 1];
                    sectionsArray[j - 1] = temp;
                } else {
                    break;
                }
            }
        }
        return tempSectionsArray;
    }

    public parseSectionsByColumns(sectionsArray: any[], option: any, trans: any): any {
        let parsedSectionArray: any = [];
        let underscoreIndex = null;
        let counter = 0;
        const maybeColumn = option["columns"].find((key: string) => key.includes("_"));
        if (maybeColumn) {
            underscoreIndex = maybeColumn.indexOf("_");
        }
        for (let section of sectionsArray) {
            // if (counter++ > 64000) {
            //     return parsedSectionArray;
            // }
            let parsedSection: any = {};
            for (let columnValue of option["columns"]) {
                // let underPos: number = null;
                let shortColumnValue: string;
                if (columnValue.indexOf("_") === -1) {
                    for (let obj of trans.apply) {
                        for (let pair of Object.entries(obj)) {
                            const tokenObj = pair[1];
                            const tokenVal = Object.values(tokenObj)[0];
                            underscoreIndex = tokenVal.indexOf("_");
                            shortColumnValue = tokenVal.substring(underscoreIndex + 1);
                        }
                        // for (let applyKey in obj) {
                        //         for (let applyToken in obj[applyKey]) {
                        //             underPos = obj[applyKey][applyToken].indexOf("_");
                        //             shortColumnValue = obj[applyKey][applyToken].substring(underPos + 1,
                        //                 obj[applyKey][applyToken].length);
                        //             // columnValue = obj[applyKey][applyToken];
                        //         }
                        // }
                    }
                } else {
                    // underPos = columnValue.indexOf("_");
                    shortColumnValue = columnValue.substring(underscoreIndex + 1, columnValue.length);
                }
                switch (shortColumnValue) {
                    case "avg":
                        parsedSection[columnValue] = section["avg"];
                        break;
                    case "pass":
                        parsedSection[columnValue] = section["pass"];
                        break;
                    case "fail":
                        parsedSection[columnValue] = section["fail"];
                        break;
                    case "audit":
                        parsedSection[columnValue] = section["audit"];
                        break;
                    case "year":
                        parsedSection[columnValue] = section["year"];
                        break;
                    case "dept":
                        parsedSection[columnValue] = section["subject"];
                        break;
                    case "id":
                        parsedSection[columnValue] = section["course"];
                        break;
                    case "instructor":
                        parsedSection[columnValue] = section["professor"];
                        break;
                    case "title":
                        parsedSection[columnValue] = section["title"];
                        break;
                    case "uuid":
                        parsedSection[columnValue] = section["id"];
                        break;
                    case "fullname":
                        parsedSection[columnValue] = section["fullName"];
                        break;
                    case "shortname":
                        parsedSection[columnValue] = section["shortName"];
                        break;
                    case "number":
                        parsedSection[columnValue] = section["num"];
                        break;
                    case "name":
                        parsedSection[columnValue] = section["name"];
                        break;
                    case "address":
                        parsedSection[columnValue] = section["address"];
                        break;
                    case "lat":
                        parsedSection[columnValue] = section["lat"];
                        break;
                    case "lon":
                        parsedSection[columnValue] = section["lon"];
                        break;
                    case "seats":
                        parsedSection[columnValue] = section["seats"];
                        break;
                    case "type":
                        parsedSection[columnValue] = section["type"];
                        break;
                    case "furniture":
                        parsedSection[columnValue] = section["furniture"];
                        break;
                    case "href":
                        parsedSection[columnValue] = section["href"];
                        break;
                    default:
                        break;
                }
            }
            parsedSectionArray.push(parsedSection);
        }
        return parsedSectionArray;
    }

    public getResults(section: any, filter: IFilter): boolean {
        if (filter === undefined) {
            return true;
        }
        let filterType = filter.type;
        switch (filterType) {
                case "AND":
                    let boolAndArray: boolean[] = [];
                    let childAndArray: IFilter[] = filter.andArray;
                    for (let andChild of childAndArray) {
                        boolAndArray.push(this.getResults(section, andChild));
                    }
                    let boolAllTrue: boolean = true;
                    for (let bool of boolAndArray) {
                        if (!bool) {
                            boolAllTrue = false;
                        }
                    }
                    return boolAllTrue;
                case "OR":
                    let boolOrArray: boolean[] = [];
                    let childOrArray: IFilter[] = filter.orArray;
                    for (let orChild of childOrArray) {
                        boolOrArray.push(this.getResults(section, orChild));
                    }
                    for (let bool of boolOrArray) {
                        if (bool) {
                            return true;
                        }
                    }
                    return false;
                case "NOT":
                    return !this.getResults(section, filter.notObject);
                case "LT":
                    let filterKey1: string = filter.key;
                    let filterVal1: number = filter.num;
                    switch (filterKey1) {
                        case "avg":
                            return (section["avg"] < filterVal1);
                        case "pass":
                            return (section["pass"] < filterVal1);
                        case "fail":
                            return (section["fail"] < filterVal1);
                        case "audit":
                            return (section["audit"] < filterVal1);
                        case "year":
                            return (section["year"] < filterVal1);
                        case "lat":
                            return (section["lat"] < filterVal1);
                        case "lon":
                            return (section["lon"] < filterVal1);
                        case "seats":
                            return (section["seats"] < filterVal1);
                        default:
                            break;
                    }
                    break;
                case "EQ":
                    let filterKey2: string = filter.key;
                    let filterVal2: number = filter.num;
                    switch (filterKey2) {
                        case "avg":
                            return (section["avg"] === filterVal2);
                        case "pass":
                            return (section["pass"] === filterVal2);
                        case "fail":
                            return (section["fail"] === filterVal2);
                        case "audit":
                            return (section["audit"] === filterVal2);
                        case "year":
                            return (section["year"] === filterVal2);
                        case "lat":
                            return (section["lat"] === filterVal2);
                        case "lon":
                            return (section["lon"] === filterVal2);
                        case "seats":
                            return (section["seats"] === filterVal2);
                        default:
                            break;
                    }
                    break;
                case "GT":
                    let filterKey3: string = filter.key;
                    let filterVal3: number = filter.num;
                    switch (filterKey3) {
                        case "avg":
                            return (section["avg"] > filterVal3);
                        case "pass":
                            return (section["pass"] > filterVal3);
                        case "fail":
                            return (section["fail"] > filterVal3);
                        case "audit":
                            return (section["audit"] > filterVal3);
                        case "year":
                            return (section["year"] > filterVal3);
                        case "lat":
                            return (section["lat"] > filterVal3);
                        case "lon":
                            return (section["lon"] > filterVal3);
                        case "seats":
                            return (section["seats"] > filterVal3);
                        default:
                            break;
                    }
                    break;
                case "IS":
                    let filterKey4: string = filter.key;
                    let filterVal4: string = filter.isVal;
                    if (filterVal4.charAt(0) === "*" && filterVal4.charAt(filterVal4.length - 1) === "*") {
                        filterVal4 = filterVal4.substring(1, filterVal4.length - 1);
                        return this.bothWildcard(filterKey4, filterVal4, section);
                    } else if (filterVal4.charAt(0) === "*") {
                        filterVal4 = filterVal4.substring(1, filterVal4.length);
                        return this.frontWildcard(filterKey4, filterVal4, section);
                    } else if (filterVal4.charAt(filterVal4.length - 1) === "*") {
                        filterVal4 = filterVal4.substring(0, filterVal4.length - 1);
                        return this.backWildcard(filterKey4, filterVal4, section);
                    } else {
                        return this.nonWildcard(filterKey4, filterVal4, section);
                    }
                default:
                    break;
            }
        return false;
    }

    public order(arrayToOrder: any[], option: any): any[] {
        return this.sortResults(arrayToOrder, option);
    }

    public bothWildcard(key: string, val: string, section: any): boolean {
        switch (key) {
            case "dept":
                return (section["subject"].includes(val));
            case "id":
                return (section["course"].includes(val));
            case "instructor":
                return (section["professor"].includes(val));
            case "title":
                return (section["title"].includes(val));
            case "uuid":
                return (section["id"].includes(val));
            case "fullname":
                return (section["fullName"].includes(val));
            case "shortname":
                return (section["shortName"].includes(val));
            case "number":
                return (section["num"].includes(val));
            case "name":
                return (section["name"].includes(val));
            case "address":
                return (section["address"].includes(val));
            case "type":
                return (section["type"].includes(val));
            case "furniture":
                return (section["furniture"].includes(val));
            case "href":
                return (section["href"].includes(val));
            default:
                break;
        }
    }
    public frontWildcard(key: string, val: string, section: any): boolean {
        let sectionString: string = "";
        switch (key) {
            case "dept":
                sectionString = section["subject"];
                return this.frontCompHelper(sectionString, val);
            case "id":
                sectionString = section["course"];
                return this.frontCompHelper(sectionString, val);
            case "instructor":
                sectionString = section["professor"];
                return this.frontCompHelper(sectionString, val);
            case "title":
                sectionString = section["title"];
                return this.frontCompHelper(sectionString, val);
            case "uuid":
                sectionString = section["id"];
                return this.frontCompHelper(sectionString, val);
            case "fullname":
                sectionString = section["fullName"];
                return this.frontCompHelper(sectionString, val);
            case "shortname":
                sectionString = section["shortName"];
                return this.frontCompHelper(sectionString, val);
            case "number":
                sectionString = section["num"];
                return this.frontCompHelper(sectionString, val);
            case "name":
                sectionString = section["name"];
                return this.frontCompHelper(sectionString, val);
            case "address":
                sectionString = section["address"];
                return this.frontCompHelper(sectionString, val);
            case "type":
                sectionString = section["type"];
                return this.frontCompHelper(sectionString, val);
            case "furniture":
                sectionString = section["furniture"];
                return this.frontCompHelper(sectionString, val);
            case "href":
                sectionString = section["href"];
                return this.frontCompHelper(sectionString, val);
            default:
                break;
        }
    }

    public backWildcard(key: string, val: string, section: any): boolean {
        let sectionString: string = "";
        switch (key) {
            case "dept":
                sectionString = section["subject"];
                return this.backCompHelper(sectionString, val);
            case "id":
                sectionString = section["course"];
                return this.backCompHelper(sectionString, val);
            case "instructor":
                sectionString = section["professor"];
                return this.backCompHelper(sectionString, val);
            case "title":
                sectionString = section["title"];
                return this.backCompHelper(sectionString, val);
            case "uuid":
                sectionString = section["id"];
                return this.backCompHelper(sectionString, val);
            case "fullname":
                sectionString = section["fullName"];
                return this.backCompHelper(sectionString, val);
            case "shortname":
                sectionString = section["shortName"];
                return this.backCompHelper(sectionString, val);
            case "number":
                sectionString = section["num"];
                return this.backCompHelper(sectionString, val);
            case "name":
                sectionString = section["name"];
                return this.backCompHelper(sectionString, val);
            case "address":
                sectionString = section["address"];
                return this.backCompHelper(sectionString, val);
            case "type":
                sectionString = section["type"];
                return this.backCompHelper(sectionString, val);
            case "furniture":
                sectionString = section["furniture"];
                return this.backCompHelper(sectionString, val);
            case "href":
                sectionString = section["href"];
                return this.backCompHelper(sectionString, val);
            default:
                break;
        }
    }

    public nonWildcard(key: string, val: string, section: any): boolean {
        switch (key) {
            case "dept":
                return (section["subject"] === val);
            case "id":
                return (section["course"] === val);
            case "instructor":
                return (section["professor"] === val);
            case "title":
                return (section["title"] === val);
            case "uuid":
                return (section["id"] === val);
            case "fullname":
                return (section["fullName"] === val);
            case "shortname":
                return (section["shortName"] === val);
            case "number":
                return (section["num"] === val);
            case "name":
                return (section["name"] === val);
            case "address":
                return (section["address"] === val);
            case "type":
                return (section["type"] === val);
            case "furniture":
                return (section["furniture"] === val);
            case "href":
                return (section["href"] === val);
            default:
                break;
        }
    }

    public frontCompHelper(sectionString: string, val: string): boolean {
        let pos: number = sectionString.indexOf(val);
        if (pos === -1) {
            return false;
        }
        // now check to make sure back doesn't have extraneous characters
        let removeFront: string = sectionString.substring(pos, sectionString.length);
        return (removeFront === val);
    }

    public backCompHelper(sectionString: string, val: string): boolean {
        let pos: number = sectionString.indexOf(val);
        if (pos === -1) {
            return false;
        }
        // now check to make sure back doesn't have extraneous characters
        let removeBack: string = sectionString.substring(0, val.length);
        return (removeBack === val);
    }

}
