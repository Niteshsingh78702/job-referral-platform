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
import { RequestInterviewDto, ScheduleInterviewDto } from './dto';
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
     * HR requests an interview for an application
     * Creates interview with PAYMENT_PENDING status
     */
    @Post('request/:applicationId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.CREATED)
    async requestInterview(
        @CurrentUser('sub') userId: string,
        @Param('applicationId') applicationId: string,
        @Body() dto: RequestInterviewDto,
    ) {
        return this.interviewService.requestInterview(userId, applicationId, dto);
    }

    /**
     * HR schedules an interview (only after payment is confirmed)
     */
    @Post('schedule/:interviewId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async scheduleInterview(
        @CurrentUser('sub') userId: string,
        @Param('interviewId') interviewId: string,
        @Body() dto: ScheduleInterviewDto,
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
}
