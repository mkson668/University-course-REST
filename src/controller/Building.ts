export class Building {
    private fullName: string;
    private shortName: string;
    private address: string;
    private lat: number;
    private lon: number;
    private href: string;

    constructor(fullName: string, shortName: string, address: string, lat: number, lon: number, href: string) {
        // TODO: implement lon lat
        this.fullName = fullName;
        this.shortName = shortName;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.href = href;
    }
}
