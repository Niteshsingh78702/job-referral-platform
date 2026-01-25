import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    Min,
    Max,
} from 'class-validator';

export class CreateTestDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(5)
    @Max(180)
    @IsOptional()
    duration?: number = 30;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    passingScore?: number = 70;

    @IsNumber()
    @Min(1)
    @IsOptional()
    totalQuestions?: number = 20;

    @IsBoolean()
    @IsOptional()
    shuffleQuestions?: boolean = true;

    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    maxTabSwitches?: number = 2;

    @IsString()
    @IsOptional()
    difficulty?: string = 'MEDIUM';

    @IsNumber()
    @Min(1)
    @Max(30)
    @IsOptional()
    validityDays?: number = 7;
}

// DTO for creating a role-based test (linked to SkillBucket)
export class CreateRoleTestDto {
    @IsString()
    skillBucketId: string;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(5)
    @Max(180)
    @IsOptional()
    duration?: number = 30;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    passingScore?: number = 70;

    @IsNumber()
    @Min(1)
    @IsOptional()
    totalQuestions?: number = 20;

    @IsNumber()
    @Min(1)
    @Max(30)
    @IsOptional()
    validityDays?: number = 7;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = false;
}

export class UpdateTestDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(5)
    @Max(180)
    @IsOptional()
    duration?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    passingScore?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    totalQuestions?: number;

    @IsNumber()
    @Min(1)
    @Max(30)
    @IsOptional()
    validityDays?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class AddQuestionDto {
    @IsString()
    question: string;

    @IsArray()
    options: string[];

    @IsNumber()
    @Min(0)
    correctAnswer: number;

    @IsString()
    @IsOptional()
    explanation?: string;

    @IsNumber()
    @IsOptional()
    points?: number = 1;
}

export class SubmitAnswerDto {
    @IsString()
    questionId: string;

    @IsNumber()
    selectedAnswer: number;
}

export class TestEventDto {
    @IsString()
    eventType: 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'RIGHT_CLICK' | 'FOCUS_LOST';

    @IsOptional()
    eventData?: any;
}
