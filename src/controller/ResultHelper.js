"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
class ResultHelper {
    constructor() {
        this.isGrouped = false;
        this.tempSections = [];
        this.resultSections = [];
        this.finalGroupedArray = [];
        this.allAppliedKeys = [];
        this.keyArrayIndex = 0;
    }
    getResultsArray(sectionsArray, filter, option, trans) {
        for (let section of sectionsArray) {
            if (this.getResults(section, filter)) {
                this.tempSections.push(section);
            }
        }
        let resultsColumn = this.parseSectionsByColumns(this.tempSections, option, trans);
        if (trans === null) {
            return this.order(resultsColumn, option);
        }
        let grouped2DResult = this.groupPartitioner(resultsColumn, trans, 0);
        let appliedAndFlattened = this.applyAndFlatten(this.finalGroupedArray, trans);
        let resultsColumnAndOrder = this.sortResults(appliedAndFlattened, option);
        return resultsColumnAndOrder;
    }
    groupPartitioner(origArray, trans, i) {
        if (i >= trans["group"].length) {
            this.finalGroupedArray.push(origArray);
            this.isGrouped = true;
            return origArray;
        }
        let categorizer = trans["group"][i];
        let groupedArray = [];
        let groupedArrayFlattened = [];
        let newOrigArray = origArray;
        while (newOrigArray.length > 0) {
            let updateOrig = [];
            let elementOfNew = [];
            let matchTo = newOrigArray[0][categorizer];
            for (let section of newOrigArray) {
                if (section[categorizer] === matchTo) {
                    elementOfNew.push(section);
                }
                else {
                    updateOrig.push(section);
                }
            }
            groupedArray.push(elementOfNew);
            newOrigArray = updateOrig;
        }
        let ind = 0;
        while (ind < groupedArray.length) {
            let subs = this.groupPartitioner(groupedArray[ind], trans, i + 1);
            ++ind;
        }
        return;
    }
    applyAndFlatten(arrayToApply, trans) {
        let lastKey = trans.apply.length - 1;
        let counter = 0;
        let finalArray = [];
        let currSection = null;
        for (let oneDArray of arrayToApply) {
            counter = 0;
            for (let applyKey of trans.apply) {
                for (let key in applyKey) {
                    for (let innerKey in applyKey[key]) {
                        switch (innerKey) {
                            case "MAX":
                                let currMax = null;
                                for (let section of oneDArray) {
                                    if (currMax === null) {
                                        currMax = section[key];
                                        currSection = section;
                                    }
                                    else {
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
                                let currMin = null;
                                for (let section of oneDArray) {
                                    if (currMin === null) {
                                        currMin = section[key];
                                        currSection = section;
                                    }
                                    else {
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
                                let len = this.unique(oneDArray, key);
                                oneDArray[0][key] = len.length;
                                if (counter === lastKey) {
                                    finalArray.push(oneDArray[0]);
                                }
                                counter++;
                                break;
                            case "AVG":
                                let acc1 = new decimal_js_1.default(0);
                                let avg = new decimal_js_1.default(0);
                                for (let section of oneDArray) {
                                    acc1 = acc1.add(new decimal_js_1.default(section[key]));
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
                                let acc2 = new decimal_js_1.default(0);
                                for (let section of oneDArray) {
                                    acc2 = acc2.add(new decimal_js_1.default(section[key]));
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
        }
        return finalArray;
    }
    unique(arr, key) {
        let unique = {};
        let distinct = [];
        for (let i in arr) {
            if (typeof (unique[arr[i][key]]) === "undefined") {
                distinct.push(arr[i][key]);
            }
            unique[arr[i][key]] = 0;
        }
        return distinct;
    }
    sortResults(sectionsArray, option) {
        if (sectionsArray.length > 5000) {
            return false;
        }
        let order = option["order"];
        if (order === null || order === "") {
            return sectionsArray;
        }
        if (typeof order === "object") {
            let direction = order.dir;
            let keysArray = order.keys;
            let arrayToDirection = [];
            if (keysArray.length === 1) {
                arrayToDirection = this.singleSortHelper(sectionsArray, keysArray[0]);
                if (direction === "DOWN") {
                    let reversedArray = [];
                    for (let i = arrayToDirection.length - 1; i >= 0; --i) {
                        reversedArray.push(arrayToDirection[i]);
                    }
                    arrayToDirection = reversedArray;
                }
            }
            else if (keysArray.length > 1) {
                arrayToDirection = this.multipleSortHelper(sectionsArray, keysArray, option);
                arrayToDirection = this.flattenDeep(arrayToDirection);
            }
            else {
                arrayToDirection = sectionsArray;
            }
            return arrayToDirection;
        }
        return this.singleSortHelper(sectionsArray, order);
    }
    multipleSortHelper(sectionsArray, orderKeys, option) {
        if (orderKeys.length === this.keyArrayIndex || sectionsArray.length === 1) {
            return sectionsArray;
        }
        let direction = option.order.dir;
        sectionsArray = this.singleSortHelper(sectionsArray, orderKeys[this.keyArrayIndex]);
        if (direction === "DOWN") {
            let reversedArray = [];
            for (let i = sectionsArray.length - 1; i >= 0; --i) {
                reversedArray.push(sectionsArray[i]);
            }
            sectionsArray = reversedArray;
        }
        let index = 0;
        let instancesArray = [];
        while (index < sectionsArray.length) {
            let tieValue = sectionsArray[index][orderKeys[this.keyArrayIndex]];
            let amountOfInstances = 1;
            let matches = true;
            while (matches) {
                index++;
                if (index >= sectionsArray.length) {
                    instancesArray.push(amountOfInstances);
                    matches = false;
                    break;
                }
                else {
                    if (sectionsArray[index][orderKeys[this.keyArrayIndex]] === tieValue) {
                        amountOfInstances++;
                    }
                    else {
                        instancesArray.push(amountOfInstances);
                        matches = false;
                        break;
                    }
                }
            }
        }
        let newOuterArray = [];
        let indexOfSectionsArray = 0;
        for (let occurrences of instancesArray) {
            let newInnerArray = [];
            let copyOrderKeys = orderKeys;
            this.keyArrayIndex = 0;
            while (occurrences > 0) {
                newInnerArray.push(sectionsArray[indexOfSectionsArray]);
                indexOfSectionsArray++;
                occurrences--;
            }
            this.keyArrayIndex++;
            let recursiveInner = this.multipleSortHelper(newInnerArray, copyOrderKeys, option);
            newOuterArray.push(recursiveInner);
        }
        return newOuterArray;
    }
    flattenDeep(arr1) {
        return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(this.flattenDeep(val)) : acc.concat(val), []);
    }
    singleSortHelper(sectionsArray, orderKey) {
        let result = [];
        let shortOrderValue;
        let underPos = orderKey.indexOf("_");
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
    bubbleSortSectionsArray(sectionsArray, orderBy) {
        let length = sectionsArray.length;
        let tempSectionsArray = sectionsArray;
        for (let x = 1; x < length; x++) {
            for (let j = x; j >= 1; j--) {
                let tempSectionJ = tempSectionsArray[j][orderBy];
                let tempSectionJminus1 = tempSectionsArray[j - 1][orderBy];
                if (tempSectionJ < tempSectionJminus1) {
                    let temp = sectionsArray[j];
                    sectionsArray[j] = sectionsArray[j - 1];
                    sectionsArray[j - 1] = temp;
                }
                else {
                    break;
                }
            }
        }
        return tempSectionsArray;
    }
    parseSectionsByColumns(sectionsArray, option, trans) {
        let parsedSectionArray = [];
        let underscoreIndex = null;
        let counter = 0;
        const maybeColumn = option["columns"].find((key) => key.includes("_"));
        if (maybeColumn) {
            underscoreIndex = maybeColumn.indexOf("_");
        }
        for (let section of sectionsArray) {
            let parsedSection = {};
            for (let columnValue of option["columns"]) {
                let shortColumnValue;
                if (columnValue.indexOf("_") === -1) {
                    for (let obj of trans.apply) {
                        for (let pair of Object.entries(obj)) {
                            const tokenObj = pair[1];
                            const tokenVal = Object.values(tokenObj)[0];
                            underscoreIndex = tokenVal.indexOf("_");
                            shortColumnValue = tokenVal.substring(underscoreIndex + 1);
                        }
                    }
                }
                else {
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
    getResults(section, filter) {
        if (filter === undefined) {
            return true;
        }
        let filterType = filter.type;
        switch (filterType) {
            case "AND":
                let boolAndArray = [];
                let childAndArray = filter.andArray;
                for (let andChild of childAndArray) {
                    boolAndArray.push(this.getResults(section, andChild));
                }
                let boolAllTrue = true;
                for (let bool of boolAndArray) {
                    if (!bool) {
                        boolAllTrue = false;
                    }
                }
                return boolAllTrue;
            case "OR":
                let boolOrArray = [];
                let childOrArray = filter.orArray;
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
                let filterKey1 = filter.key;
                let filterVal1 = filter.num;
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
                let filterKey2 = filter.key;
                let filterVal2 = filter.num;
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
                let filterKey3 = filter.key;
                let filterVal3 = filter.num;
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
                let filterKey4 = filter.key;
                let filterVal4 = filter.isVal;
                if (filterVal4.charAt(0) === "*" && filterVal4.charAt(filterVal4.length - 1) === "*") {
                    filterVal4 = filterVal4.substring(1, filterVal4.length - 1);
                    return this.bothWildcard(filterKey4, filterVal4, section);
                }
                else if (filterVal4.charAt(0) === "*") {
                    filterVal4 = filterVal4.substring(1, filterVal4.length);
                    return this.frontWildcard(filterKey4, filterVal4, section);
                }
                else if (filterVal4.charAt(filterVal4.length - 1) === "*") {
                    filterVal4 = filterVal4.substring(0, filterVal4.length - 1);
                    return this.backWildcard(filterKey4, filterVal4, section);
                }
                else {
                    return this.nonWildcard(filterKey4, filterVal4, section);
                }
            default:
                break;
        }
        return false;
    }
    order(arrayToOrder, option) {
        return this.sortResults(arrayToOrder, option);
    }
    bothWildcard(key, val, section) {
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
    frontWildcard(key, val, section) {
        let sectionString = "";
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
    backWildcard(key, val, section) {
        let sectionString = "";
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
    nonWildcard(key, val, section) {
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
    frontCompHelper(sectionString, val) {
        let pos = sectionString.indexOf(val);
        if (pos === -1) {
            return false;
        }
        let removeFront = sectionString.substring(pos, sectionString.length);
        return (removeFront === val);
    }
    backCompHelper(sectionString, val) {
        let pos = sectionString.indexOf(val);
        if (pos === -1) {
            return false;
        }
        let removeBack = sectionString.substring(0, val.length);
        return (removeBack === val);
    }
}
exports.ResultHelper = ResultHelper;
//# sourceMappingURL=ResultHelper.js.map