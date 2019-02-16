/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
// document.querySelector("nav").querySelector("a.nav-item.tab.active")
CampusExplorer.buildQuery = function() {
    let queryType = document.querySelector("nav").querySelector("a.nav-item.tab.active").attributes[1].value;
    let query = {};
    let collectionOfConditions;
    let cond;
    query["WHERE"] = {};
    if (queryType === "courses") {
    // TODO: implement!
        let container = document.getElementsByClassName('conditions-container')[0];
        let containerchlld = document.getElementsByClassName('conditions-container')[0].children;
    if (document.getElementsByClassName('conditions-container')[0].children.length < 2) {
        if (document.getElementById('courses-conditiontype-none').checked) {
            collectionOfConditions = document.getElementsByClassName('conditions-container')[0].children;
            for (let i = 0; i < collectionOfConditions.length; i++) {
                if (collectionOfConditions[i].children.length === 0) {
                    break;
                }
                cond = buildConditions(collectionOfConditions[i].children);
                query["WHERE"]["NOT"] = cond;
            }
        } else {
            collectionOfConditions = document.getElementsByClassName('conditions-container')[0].children;
            for (let i = 0; i < collectionOfConditions.length; i++) {
                if (collectionOfConditions[i].children.length === 0) {
                    break;
                }
                cond = buildConditions(collectionOfConditions[i].children);
                query["WHERE"] = cond;
            }
        }
    } else {
        if (document.getElementById('courses-conditiontype-all').checked) {
            query["WHERE"]["AND"] = [];
            collectionOfConditions = document.getElementsByClassName('conditions-container')[0].children;
            for (let i = 0; i < collectionOfConditions.length; i++) {
                if (collectionOfConditions[i].children.length === 0) {
                    break;
                }
                cond = buildConditions(collectionOfConditions[i].children);
                query["WHERE"]["AND"].push(cond);
            }
        } else if (document.getElementById('courses-conditiontype-any').checked) {
            query["WHERE"]["OR"] = [];
            collectionOfConditions = document.getElementsByClassName('conditions-container')[0].children;
            for (let i = 0; i < collectionOfConditions.length; i++) {
                if (collectionOfConditions[i].children.length === 0) {
                    break;
                }
                cond = buildConditions(collectionOfConditions[i].children);
                query["WHERE"]["OR"].push(cond);
            }
        } else {
            collectionOfConditions = document.getElementsByClassName('conditions-container')[0].children;
            for (let i = 0; i < collectionOfConditions.length; i++) {
                if (collectionOfConditions[i].children.length === 0) {
                    break;
                }
                cond = buildConditions(collectionOfConditions[i].children);
                query["WHERE"]["NOT"]["OR"].push(cond);
            }
        }
    }
    let columnControlFieldCollection = document.getElementsByClassName('form-group columns')[0].children[1].children;
    query["OPTIONS"] = {};
    query["OPTIONS"]["COLUMNS"] = [];
    for (let i = 0; i < columnControlFieldCollection.length; i++) {
        if (columnControlFieldCollection[i].children[0].checked) {
            if (i < 10) {
                query["OPTIONS"]["COLUMNS"].push("courses_" + columnControlFieldCollection[i].children[0].value);
            } else {
                query["OPTIONS"]["COLUMNS"].push(columnControlFieldCollection[i].children[0].value);
            }
        }
    }
    let orderControlFieldCollection = document.getElementsByClassName('form-group order')[0].children[1].children[0].children[0];
    let descending = document.getElementsByClassName('control descending')[0].children[0].checked;
    let selectedOrders = [...orderControlFieldCollection.options]
        .filter(option => option.selected).map(option => option);
    // credz https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
    if (!descending && selectedOrders.length === 0) {
        // keep goin
    } else if (!descending && selectedOrders.length === 1) {
        if (selectedOrders[0].index < 10) {
            query["OPTIONS"]["ORDER"] = "courses_" + selectedOrders[0].value;
        } else {
            query["OPTIONS"]["ORDER"] = selectedOrders[0].value;
        }
    } else {
        query["OPTIONS"]["ORDER"] = {};
        if (descending) {
            query["OPTIONS"]["ORDER"]["dir"] = "DOWN";
        } else {
            query["OPTIONS"]["ORDER"]["dir"] = "UP";
        }
        query["OPTIONS"]["ORDER"]["keys"] = [];
        for (let i = 0; i < selectedOrders.length; i++) {
            let key;
            if (selectedOrders[i].index < 10) {
                key = "courses_" + selectedOrders[i].value;
            } else {
                key = selectedOrders[i].value;
            }
            query["OPTIONS"]["ORDER"]["keys"].push(key);
        }
    }
    let groupControlFieldCollection = document.getElementsByClassName('form-group groups')[0].children[1].children;
    let acc = 0;
    let tempGroupArray = [];
    for (let i = 0; i < groupControlFieldCollection.length; i++) {
        if (groupControlFieldCollection[i].children[0].checked) {
            tempGroupArray.push("courses_" + groupControlFieldCollection[i].children[0].value);
            acc++;
        }
    }
    if (acc !== 0) { // we will need transform
        query["TRANSFORMATIONS"] = {};
        query["TRANSFORMATIONS"]["GROUP"] = tempGroupArray;
        query["TRANSFORMATIONS"]["APPLY"] = [];
        let collectionOfTransformations = document.getElementsByClassName('transformations-container')[0].children;
        for (let i = 0; i < collectionOfTransformations.length; i++) {
            if (collectionOfTransformations[i].children.length === 0) {
                break;
            }

            let transCond = buildTransformations(collectionOfTransformations[i].children);
            query["TRANSFORMATIONS"]["APPLY"].push(transCond);
        }
    }
} else {
        // rooms queries
        //let roomsConatainer = document.getElementsByClassName('conditions-container');
        if (document.getElementsByClassName('conditions-container')[1].children.length < 2) {
            if (document.getElementById('rooms-conditiontype-none').checked) {
                collectionOfConditions = document.getElementsByClassName('conditions-container')[1].children;
                for (let i = 0; i < collectionOfConditions.length; i++) {
                    if (collectionOfConditions[i].children.length === 0) {
                        break;
                    }
                    cond = buildRoomsConditions(collectionOfConditions[i].children);
                    query["WHERE"]["NOT"] = cond;
                }
            } else {
                collectionOfConditions = document.getElementsByClassName('conditions-container')[1].children;
                for (let i = 0; i < collectionOfConditions.length; i++) {
                    if (collectionOfConditions[i].children.length === 0) {
                        break;
                    }
                    cond = buildRoomsConditions(collectionOfConditions[i].children);
                    query["WHERE"] = cond;
                }
            }
        } else {
            if (document.getElementById('rooms-conditiontype-all').checked) {
                query["WHERE"]["AND"] = [];
                collectionOfConditions = document.getElementsByClassName('conditions-container')[1].children;
                for (let i = 0; i < collectionOfConditions.length; i++) {
                    if (collectionOfConditions[i].children.length === 0) {
                        break;
                    }
                    cond = buildRoomsConditions(collectionOfConditions[i].children);
                    query["WHERE"]["AND"].push(cond);
                }
            } else if (document.getElementById('rooms-conditiontype-any').checked) {
                collectionOfConditions = document.getElementsByClassName('conditions-container')[1].children;
                for (let i = 0; i < collectionOfConditions.length; i++) {
                    if (collectionOfConditions[i].children.length === 0) {
                        break;
                    }
                    cond = buildRoomsConditions(collectionOfConditions[i].children);
                    query["WHERE"]["OR"].push(cond);
                }
            } else {
                collectionOfConditions = document.getElementsByClassName('conditions-container')[1].children;
                for (let i = 0; i < collectionOfConditions.length; i++) {
                    if (collectionOfConditions[i].children.length === 0) {
                        break;
                    }
                    cond = buildRoomsConditions(collectionOfConditions[i].children);
                    query["WHERE"]["NOT"]["OR"].push(cond);
                }
            }
        }
        let columnControlFieldCollection = document.getElementsByClassName('form-group columns')[1].children[1].children;
        query["OPTIONS"] = {};
        query["OPTIONS"]["COLUMNS"] = [];
        for (let i = 0; i < columnControlFieldCollection.length; i++) {
            if (columnControlFieldCollection[i].children[0].checked) {
                if (i < 11) {
                    query["OPTIONS"]["COLUMNS"].push("rooms_" + columnControlFieldCollection[i].children[0].value);
                } else {
                    query["OPTIONS"]["COLUMNS"].push(columnControlFieldCollection[i].children[0].value);
                }
            }
        }
        let orderControlFieldCollection = document.getElementsByClassName('form-group order')[1].children[1].children[0].children[0];
        let descending = document.getElementsByClassName('control descending')[1].children[0].checked;
        let selectedOrders = [...orderControlFieldCollection.options]
            .filter(option => option.selected).map(option => option);
        // credz https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
        if (!descending && selectedOrders.length === 0) {
            // keep goin
        } else if (!descending && selectedOrders.length === 1) {
            if (selectedOrders[0].index < 11) {
                query["OPTIONS"]["ORDER"] = "rooms_" + selectedOrders[0].value;
            } else {
                query["OPTIONS"]["ORDER"] = selectedOrders[0].value;
            }
        } else {
            query["OPTIONS"]["ORDER"] = {};
            if (descending) {
                query["OPTIONS"]["ORDER"]["dir"] = "DOWN";
            } else {
                query["OPTIONS"]["ORDER"]["dir"] = "UP";
            }
            query["OPTIONS"]["ORDER"]["keys"] = [];
            for (let i = 0; i < selectedOrders.length; i++) {
                let key;
                if (selectedOrders[i].index < 11) {
                    key = "rooms_" + selectedOrders[i].value;
                } else {
                    key = selectedOrders[i].value;
                }
                query["OPTIONS"]["ORDER"]["keys"].push(key);
            }
        }
        let groupControlFieldCollection = document.getElementsByClassName('form-group groups')[1].children[1].children;
        let acc = 0;
        let tempGroupArray = [];
        for (let i = 0; i < groupControlFieldCollection.length; i++) {
            if (groupControlFieldCollection[i].children[0].checked) {
                tempGroupArray.push("rooms_" + groupControlFieldCollection[i].children[0].value);
                acc++;
            }
        }
        if (acc !== 0) { // we will need transform
            query["TRANSFORMATIONS"] = {};
            query["TRANSFORMATIONS"]["GROUP"] = tempGroupArray;
            query["TRANSFORMATIONS"]["APPLY"] = [];
            let collectionOfTransformations = document.getElementsByClassName('transformations-container')[1].children;
            for (let i = 0; i < collectionOfTransformations.length; i++) {
                if (collectionOfTransformations[i].children.length === 0) {
                    break;
                }
                let transCond = buildTransformationsRooms(collectionOfTransformations[i].children);
                query["TRANSFORMATIONS"]["APPLY"].push(transCond);
            }
        }
    }
    return query;
};

function buildTransformations(arrayElements) {
    let textInput = arrayElements[0];
    let transOperator = arrayElements[1];
    let transField = arrayElements[2];
    let transformObject = {};
    textInput = textInput.children[0].value;
    transOperator = transOperator.children[0].value;
    transField = transField.children[0].value;
    transformObject[textInput] = {};
    transformObject[textInput][transOperator] = "courses_" + transField;
    return transformObject;
}

function buildTransformationsRooms(arrayElements) {
    let textInput = arrayElements[0];
    let transOperator = arrayElements[1];
    let transField = arrayElements[2];
    let transformObject = {};
    textInput = textInput.children[0].value;
    transOperator = transOperator.children[0].value;
    transField = transField.children[0].value;
    transformObject[textInput] = {};
    transformObject[textInput][transOperator] = "rooms_" + transField;
    return transformObject;
}

function buildConditions(arrayElement) {
    let elementInArray = {};
    let negated = arrayElement[0];
    let field = arrayElement[1];
    let operator = arrayElement[2];
    let textInput = arrayElement[3];
    let selectedField;
    let selectedOperator;
    let userInputText;
    let innerObject = {};
    let appendedField;
    if (negated.children[0].checked) {
        selectedField = field.children[0].value;
        selectedOperator = operator.children[0].value;
        userInputText = textInput.children[0].value;
        if (field.children[0].selectedIndex < 10) {
            appendedField = "courses_" + selectedField;
        } else {
            appendedField = selectedField;
        }
        if (selectedField.index !== 4) {
            if (!isNaN(userInputText)) {
                userInputText = parseFloat(userInputText);
            }
        }
        innerObject[appendedField] = userInputText;
        let negationInnerObject = {};
        negationInnerObject[selectedOperator] = innerObject;
        elementInArray["NOT"] = negationInnerObject;
    } else {
    selectedField = field.children[0].value;
    selectedOperator = operator.children[0].value;
    userInputText = textInput.children[0].value;
        if (field.children[0].selectedIndex < 10) {
            appendedField = "courses_" + selectedField;
        } else {
            appendedField = selectedField;
        }
        if (selectedField.index !== 4) {
            if (!isNaN(userInputText)) {
                userInputText = parseFloat(userInputText);
            }
        }
    innerObject[appendedField] = userInputText;
    elementInArray[selectedOperator] = innerObject;
    }
    return elementInArray;
}

function buildRoomsConditions(arrayElement) {
    let elementInArray = {};
    let negated = arrayElement[0];
    let field = arrayElement[1];
    let operator = arrayElement[2];
    let textInput = arrayElement[3];
    let selectedField;
    let selectedOperator;
    let userInputText;
    let innerObject = {};
    let appendedField;
    if (negated.children[0].checked) {
        selectedField = field.children[0].value;
        selectedOperator = operator.children[0].value;
        userInputText = textInput.children[0].value;
        if (field.children[0].selectedIndex < 11) {
            appendedField = "rooms_" + selectedField;
        } else {
            appendedField = selectedField;
        }
        if (selectedField.index !== 7) {
            if (!isNaN(userInputText)) {
                    userInputText = parseFloat(userInputText);
            }
        }
        innerObject[appendedField] = userInputText;
        let negationInnerObject = {};
        negationInnerObject[selectedOperator] = innerObject;
        elementInArray["NOT"] = negationInnerObject;
    } else {
        selectedField = field.children[0].value;
        selectedOperator = operator.children[0].value;
        userInputText = textInput.children[0].value;
        if (field.children[0].selectedIndex < 11) {
            appendedField = "rooms_" + selectedField;
        } else {
            appendedField = selectedField;
        }
        if (selectedField.index !== 7) {
            if (!isNaN(userInputText)) {
                userInputText = parseFloat(userInputText);
            }
        }
        innerObject[appendedField] = userInputText;
        elementInArray[selectedOperator] = innerObject;
    }
    return elementInArray;
}

/*
function findField(selectObject) {
    if (selectObject[0].selected) {
        return selectObject[0].text;
    } else if (selectObject[1].selected) {
        return selectObject[1].text;
    } else if (selectObject[2].selected) {
        return selectObject[2].text;
    } else if (selectObject[3].selected) {
        return selectObject[3].text;
    } else if (selectObject[4].selected) {
        return selectObject[4].text;
    } else if (selectObject[5].selected) {
        return selectObject[5].text;
    } else if (selectObject[6].selected) {
        return selectObject[6].text;
    } else if (selectObject[7].selected) {
        return selectObject[7].text;
    } else if (selectObject[8].selected) {
        return selectObject[8].text;
    } else {
        return selectObject[9].text;
    }
}

function findOperator(operatorObject) {
    if (operatorObject[0].selected) {
        return operatorObject[0].text;
    } else if (operatorObject[1].selected) {
        return operatorObject[1].text;
    } else if (operatorObject[2].selected) {
        return operatorObject[2].text;
    } else {
        return operatorObject[3].text;
    }
}
*/
