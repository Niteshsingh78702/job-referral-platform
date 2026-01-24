import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum InterviewMode {
    CALL = 'CALL',
    VIDEO = 'VIDEO',
    ONSITE = 'ONSITE',
}

/**
 * DTO for HR to shortlist a candidate for interview.
 * Date/time are optional at this stage.
 * Schedule will be set AFTER candidate pays.
 */
export class ConfirmInterviewDto {
    @IsOptional()
    @IsDateString()
    scheduledDate?: string; // Optional - will be set after payment

    @IsOptional()
    @IsString()
    @MaxLength(50)
    scheduledTime?: string; // Optional - will be set after payment

    @IsEnum(InterviewMode)
    mode: InterviewMode; // CALL, VIDEO, or ONSITE - REQUIRED

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    hrNote?: string; // Optional note
}
