import { IsDateString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ScheduleInterviewDto {
    @IsDateString()
    scheduledDate: string; // ISO date string

    @IsString()
    @MaxLength(50)
    scheduledTime: string; // e.g., "10:00 AM IST"

    @IsOptional()
    @IsUrl()
    @MaxLength(500)
    interviewLink?: string; // Video call link (for VIDEO mode)

    @IsOptional()
    @IsString()
    @MaxLength(500)
    callDetails?: string; // Phone number or onsite address
}
