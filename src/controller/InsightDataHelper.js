"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InsightDataHelper {
    constructor() {
    }
    createInsightDataset(idVal, kindVal, numRowsVal) {
        let newFilter = { id: idVal, kind: kindVal, numRows: numRowsVal };
        return newFilter;
    }
}
exports.InsightDataHelper = InsightDataHelper;
//# sourceMappingURL=InsightDataHelper.js.map