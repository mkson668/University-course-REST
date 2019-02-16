export class Room {
    private fullName: string;
    private shortName: string;
    private num: string;
    private name: string;
    private address: string;
    private lat: number;
    private lon: number;
    private seats: number;
    private type: string;
    private furniture: string;
    private href: string;

    constructor(fullName: string,
                shortName: string,
                num: string,
                name: string,
                addr: string,
                lat: number,
                lon: number,
                seats: number,
                type: string,
                furniture: string,
                href: string) {
        this.fullName = fullName;
        this.shortName = shortName;
        this.num = num;
        this.name = name;
        this.address = addr;
        this.lat = lat;
        this.lon = lon;
        this.seats = seats;
        this.type = type;
        this.furniture = furniture;
        this.href = href;
    }
}
