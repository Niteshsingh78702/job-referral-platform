export declare enum TestType {
    STANDARD = "STANDARD",
    RAPID_FIRE = "RAPID_FIRE"
}
export declare class CreateTestTemplateDto {
    name: string;
    description?: string;
    testType: TestType;
    duration: number;
    passingCriteria: number;
    questionPoolSize: number;
    autoSelect: boolean;
    selectionTags?: string[];
    selectionRoleType?: string;
    allowSkip?: boolean;
    showLiveScore?: boolean;
}
export declare class UpdateTestTemplateDto {
    name?: string;
    description?: string;
    duration?: number;
    passingCriteria?: number;
    questionPoolSize?: number;
    autoSelect?: boolean;
    selectionTags?: string[];
    selectionRoleType?: string;
    allowSkip?: boolean;
    showLiveScore?: boolean;
    isActive?: boolean;
}
export declare class AssignTemplateDto {
    skillBucketId: string;
}
export declare class TemplateFiltersDto {
    testType?: TestType;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
