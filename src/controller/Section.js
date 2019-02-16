"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Section {
    constructor(subject, course, avg, professor, title, pass, fail, audit, id, year) {
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
}
exports.Section = Section;
//# sourceMappingURL=Section.js.map