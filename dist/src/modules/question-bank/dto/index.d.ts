export declare enum QuestionDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}
export declare enum QuestionCategory {
    TECHNICAL = "TECHNICAL",
    BEHAVIORAL = "BEHAVIORAL",
    APTITUDE = "APTITUDE",
    DOMAIN_SPECIFIC = "DOMAIN_SPECIFIC"
}
export declare class CreateQuestionDto {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    difficulty: QuestionDifficulty;
    category: QuestionCategory;
    tags: string[];
    roleType?: string;
}
export declare class UpdateQuestionDto {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    difficulty?: QuestionDifficulty;
    category?: QuestionCategory;
    tags?: string[];
    roleType?: string;
    isActive?: boolean;
}
export declare class QuestionFiltersDto {
    roleType?: string;
    difficulty?: QuestionDifficulty;
    category?: QuestionCategory;
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
}
export declare class BulkQuestionDto {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: number;
    explanation?: string;
    difficulty: string;
    category: string;
    tags: string;
    roleType?: string;
}
export declare class BulkUploadDto {
    questions: BulkQuestionDto[];
}
