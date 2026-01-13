export declare class CreateSkillBucketDto {
    code: string;
    name: string;
    description?: string;
    displayName?: string;
    experienceMin?: number;
    experienceMax?: number;
    testId?: string;
}
export declare class UpdateSkillBucketDto {
    name?: string;
    description?: string;
    displayName?: string;
    experienceMin?: number;
    experienceMax?: number;
    isActive?: boolean;
    testId?: string;
}
export declare class SkillTestStatusDto {
    skillBucketId: string;
    skillBucketCode: string;
    skillBucketName: string;
    displayName: string;
    isPassed: boolean;
    isValid: boolean;
    score?: number;
    validTill?: Date;
    validDaysRemaining?: number;
    isFailed: boolean;
    canRetest: boolean;
    retestAllowedAt?: Date;
    retestInHours?: number;
    neverTaken: boolean;
}
