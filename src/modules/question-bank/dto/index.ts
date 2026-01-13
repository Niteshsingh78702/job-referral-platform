import { IsString, IsArray, IsInt, IsOptional, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum QuestionDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export enum QuestionCategory {
    TECHNICAL = 'TECHNICAL',
    BEHAVIORAL = 'BEHAVIORAL',
    APTITUDE = 'APTITUDE',
    DOMAIN_SPECIFIC = 'DOMAIN_SPECIFIC',
}

export class CreateQuestionDto {
    @IsString()
    question: string;

    @IsArray()
    @IsString({ each: true })
    options: string[]; // ["Option A", "Option B", "Option C", "Option D"]

    @IsInt()
    @Min(0)
    @Max(3)
    correctAnswer: number; // 0, 1, 2, or 3

    @IsOptional()
    @IsString()
    explanation?: string;

    @IsEnum(QuestionDifficulty)
    difficulty: QuestionDifficulty;

    @IsEnum(QuestionCategory)
    category: QuestionCategory;

    @IsArray()
    @IsString({ each: true })
    tags: string[]; // ["Java", "DSA", "Backend"]

    @IsOptional()
    @IsString()
    roleType?: string; // "JAVA_BACKEND_0_3"
}

export class UpdateQuestionDto {
    @IsOptional()
    @IsString()
    question?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(3)
    correctAnswer?: number;

    @IsOptional()
    @IsString()
    explanation?: string;

    @IsOptional()
    @IsEnum(QuestionDifficulty)
    difficulty?: QuestionDifficulty;

    @IsOptional()
    @IsEnum(QuestionCategory)
    category?: QuestionCategory;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    roleType?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class QuestionFiltersDto {
    @IsOptional()
    @IsString()
    roleType?: string;

    @IsOptional()
    @IsEnum(QuestionDifficulty)
    difficulty?: QuestionDifficulty;

    @IsOptional()
    @IsEnum(QuestionCategory)
    category?: QuestionCategory;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class BulkQuestionDto {
    @IsString()
    question: string;

    @IsString()
    optionA: string;

    @IsString()
    optionB: string;

    @IsString()
    optionC: string;

    @IsString()
    optionD: string;

    @IsInt()
    @Min(0)
    @Max(3)
    correctAnswer: number;

    @IsOptional()
    @IsString()
    explanation?: string;

    @IsString()
    difficulty: string;

    @IsString()
    category: string;

    @IsString()
    tags: string; // Pipe-separated: "Java|DSA|Backend"

    @IsOptional()
    @IsString()
    roleType?: string;
}

export class BulkUploadDto {
    @IsArray()
    @Type(() => BulkQuestionDto)
    questions: BulkQuestionDto[];
}
