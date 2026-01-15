import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum InterviewMode {
    CALL = 'CALL',
    VIDEO = 'VIDEO',
    ONSITE = 'ONSITE',
}

export class RequestInterviewDto {
    @IsEnum(InterviewMode)
    mode: InterviewMode;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    preferredTimeWindow?: string; // e.g., "next 3 days", "Monday-Wednesday"

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    hrNotes?: string;
}
