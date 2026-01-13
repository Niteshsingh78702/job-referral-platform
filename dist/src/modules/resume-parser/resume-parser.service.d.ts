export interface ParsedResumeData {
    text: string;
    skills: string[];
    experience: {
        years: number;
        positions: string[];
    };
    education: string[];
}
export declare class ResumeParserService {
    private readonly skillKeywords;
    parseResume(file: Express.Multer.File): Promise<ParsedResumeData>;
    private extractSkills;
    private extractExperience;
    private extractEducation;
}
