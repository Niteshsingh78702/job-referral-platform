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
