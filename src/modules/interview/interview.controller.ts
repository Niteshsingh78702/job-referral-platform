import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { ConfirmInterviewDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../../common/constants';

@Controller('interviews')
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) { }

    // ===========================================
    // HR Endpoints
    // ===========================================

    /**
     * HR confirms an interview with date/time/mode.
     * NEW FLOW: HR provides all details upfront, candidate pays to unlock.
     */
    @Post('confirm/:applicationId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.CREATED)
    async confirmInterview(
        @CurrentUser('sub') userId: string,
        @Param('applicationId') applicationId: string,
        @Body() dto: ConfirmInterviewDto,
    ) {
        return this.interviewService.confirmInterview(userId, applicationId, dto);
    }

    /**
     * HR schedules interview after candidate has paid
     * Sets date, time, meeting link, and additional details
     */
    @Post('schedule/:interviewId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.OK)
    async scheduleInterview(
        @CurrentUser('sub') userId: string,
        @Param('interviewId') interviewId: string,
        @Body() dto: { scheduledDate: string; scheduledTime: string; interviewLink?: string; callDetails?: string },
    ) {
        return this.interviewService.scheduleInterview(userId, interviewId, dto);
    }

    /**
     * Get all interviews for HR's jobs
     */
    @Get('hr')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getHRInterviews(
        @CurrentUser('sub') userId: string,
        @Query('status') status?: string,
        @Query('jobId') jobId?: string,
    ) {
        return this.interviewService.getHRInterviews(userId, { status, jobId });
    }

    // ===========================================
    // Candidate Endpoints
    // ===========================================

    /**
     * Get all interviews for candidate
     */
    @Get('candidate')
    @UseGuards(RolesGuard)
    @Roles(UserRole.CANDIDATE)
    async getCandidateInterviews(@CurrentUser('sub') userId: string) {
        return this.interviewService.getCandidateInterviews(userId);
    }

    /**
     * Get specific interview for candidate
     * Returns filtered data based on interview status
     */
    @Get('candidate/:interviewId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.CANDIDATE)
    async getInterviewForCandidate(
        @CurrentUser('sub') userId: string,
        @Param('interviewId') interviewId: string,
    ) {
        return this.interviewService.getInterviewForCandidate(userId, interviewId);
    }

    // ===========================================
    // Admin Endpoints
    // ===========================================

    /**
     * Get interview statistics for admin dashboard
     */
    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAdminStats() {
        return this.interviewService.getAdminInterviewStats();
    }

    /**
     * Get all interviews for admin with pagination
     */
    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAdminInterviews(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
    ) {
        return this.interviewService.getAdminInterviews(page || 1, limit || 20, status);
    }

    /**
     * Admin marks interview as no-show (candidate or HR)
     */
    @Post('admin/:interviewId/no-show')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async markNoShow(
        @CurrentUser('sub') adminUserId: string,
        @Param('interviewId') interviewId: string,
        @Body('type') type: 'CANDIDATE' | 'HR',
    ) {
        return this.interviewService.markNoShow(interviewId, type, adminUserId);
    }

    /**
     * Admin marks interview as completed
     */
    @Post('admin/:interviewId/complete')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async markCompleted(
        @CurrentUser('sub') adminUserId: string,
        @Param('interviewId') interviewId: string,
    ) {
        return this.interviewService.markCompleted(interviewId, adminUserId);
    }

    /**
     * HR marks interview outcome (Selected/Not Selected/No Show)
     */
    @Post(':interviewId/outcome')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.OK)
    async markInterviewOutcome(
        @CurrentUser('sub') userId: string,
        @Param('interviewId') interviewId: string,
        @Body() dto: { outcome: 'SELECTED' | 'NOT_SELECTED' | 'CANDIDATE_NO_SHOW'; notes?: string; applicationId?: string },
    ) {
        return this.interviewService.markInterviewOutcome(userId, interviewId, dto);
    }
}
