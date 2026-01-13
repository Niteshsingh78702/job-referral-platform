import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateSkillBucketDto {
    @IsString()
    code: string; // e.g., JAVA_BACKEND_0_3

    @IsString()
    name: string; // e.g., "Java Basics Test"

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    displayName?: string; // "HR Shortlisting Check - Java"

    @IsOptional()
    @IsNumber()
    @Min(0)
    experienceMin?: number;

    @IsOptional()
    @IsNumber()
    @Max(10)
    experienceMax?: number;

    @IsOptional()
    @IsString()
    testId?: string; // Link to existing test
}

export class UpdateSkillBucketDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsNumber()
    experienceMin?: number;

    @IsOptional()
    @IsNumber()
    experienceMax?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    testId?: string;
}

export class SkillTestStatusDto {
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
