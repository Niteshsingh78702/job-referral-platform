import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum InterviewMode {
    CALL = 'CALL',
    VIDEO = 'VIDEO',
    ONSITE = 'ONSITE',
}

/**
 * DTO for HR to confirm an interview with scheduling details.
 * This is the primary action where HR sets date/time/mode.
 * Candidate must pay after this to unlock details.
 */
export class ConfirmInterviewDto {
    @IsDateString()
    scheduledDate: string; // ISO date string - REQUIRED

    @IsString()
    @MaxLength(50)
    scheduledTime: string; // e.g., "10:00 AM IST" - REQUIRED

    @IsEnum(InterviewMode)
    mode: InterviewMode; // CALL, VIDEO, or ONSITE - REQUIRED

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    hrNote?: string; // Optional note like "Google Meet link will be shared via email"
}
