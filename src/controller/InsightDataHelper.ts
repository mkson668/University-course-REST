import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export class InsightDataHelper {
    constructor() {
        // los comentarios son imprescindibles
    }
    public createInsightDataset(idVal: string, kindVal: InsightDatasetKind, numRowsVal: number): InsightDataset {
        let newFilter: InsightDataset = {id: idVal, kind: kindVal, numRows: numRowsVal};
        return newFilter;
    }
}
