export class Section {
    // TODO make export
    private subject: string;
    private course: string;
    private avg: number;
    private professor: string;
    private title: string;
    private pass: number;
    private fail: number;
    private audit: number;
    private id: string; // should convert as string
    private year: number;

    constructor(subject: string,
                course: string,
                avg: number,
                professor: string,
                title: string,
                pass: number,
                fail: number,
                audit: number,
                id: number,
                year: string) {
        this.subject = subject;
        this.course = course;
        this.avg = avg;
        this.professor = professor;
        this.title = title;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.id = id.toString();
        this.year = Number(year);
    }

    /*public getSubject(): string {
        return this.subject;
    }

    public getCourse(): string {
        return this.course;
    }

    public getAvg(): number {
        return this.avg;
    }
    public getProfessor(): string {
        return this.professor;
    }

    public getTitle(): string {
        return this.title;
    }

    public getPass(): number {
        return this.pass;
    }

    public getFail(): number {
        return this.fail;
    }

    public getAudit(): number {
        return this.audit;
    }

    public getId(): string {
        return this.id;
    }

    public getYear(): number {
        return this.year;
    }*/
}
