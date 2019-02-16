export interface IFilter {
    type: string;
    andArray?: IFilter[];
    orArray?: IFilter[];
    notObject?: IFilter;
    key?: string;
    num?: number;
    isVal?: string;
}
