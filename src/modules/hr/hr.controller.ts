import {
    Controller,
    Post,
    Body,
    Get,
    Put,
    Delete,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { HRService } from './services';
import {
    HRRegisterDto,
    HRLoginDto,
    UpdateHRProfileDto,
    CreateJobDto,
    UpdateJobStatusDto,
    UpdateJobDto,
} from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../../common/constants';

@Controller('hr')
export class HRController {
    constructor(private readonly hrService: HRService) { }

    // ==========================================
    // Public Routes (No Auth Required)
    // ==========================================

    @Public()
    @Post('auth/register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: HRRegisterDto, @Req() req: any) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.hrService.register(dto, deviceInfo);
    }

    @Public()
    @Post('auth/login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: HRLoginDto, @Req() req: any) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.hrService.login(dto, deviceInfo);
    }

    // ==========================================
    // Protected Routes (HR Only)
    // ==========================================

    @Get('profile')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getProfile(@CurrentUser('sub') userId: string) {
        return this.hrService.getProfile(userId);
    }

    @Put('profile')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateHRProfileDto,
    ) {
        return this.hrService.updateProfile(userId, dto);
    }

    // ==========================================
    // Dashboard Routes
    // ==========================================

    @Get('dashboard/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getDashboardStats(@CurrentUser('sub') userId: string) {
        return this.hrService.getDashboardStats(userId);
    }

    @Get('dashboard/activity')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getRecentActivity(
        @CurrentUser('sub') userId: string,
        @Query('limit') limit?: number,
    ) {
        return this.hrService.getRecentActivity(userId, limit || 10);
    }

    // ==========================================
    // Job Management Routes
    // ==========================================

    @Get('jobs')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getJobs(
        @CurrentUser('sub') userId: string,
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.hrService.getJobs(userId, { status, page, limit });
    }

    @Post('jobs')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.CREATED)
    async createJob(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateJobDto,
    ) {
        return this.hrService.createJob(userId, dto);
    }

    @Get('jobs/:jobId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getJobById(
        @CurrentUser('sub') userId: string,
        @Param('jobId') jobId: string,
    ) {
        return this.hrService.getJobById(userId, jobId);
    }

    @Put('jobs/:jobId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async updateJob(
        @CurrentUser('sub') userId: string,
        @Param('jobId') jobId: string,
        @Body() dto: UpdateJobDto,
    ) {
        return this.hrService.updateJob(userId, jobId, dto);
    }

    @Delete('jobs/:jobId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.OK)
    async deleteJob(
        @CurrentUser('sub') userId: string,
        @Param('jobId') jobId: string,
    ) {
        return this.hrService.deleteJob(userId, jobId);
    }

    @Put('jobs/:jobId/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async updateJobStatus(
        @CurrentUser('sub') userId: string,
        @Param('jobId') jobId: string,
        @Body() dto: UpdateJobStatusDto,
    ) {
        return this.hrService.updateJobStatus(userId, jobId, dto);
    }

    // ==========================================
    // Application Management Routes
    // ==========================================

    @Get('applications')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    async getApplications(
        @CurrentUser('sub') userId: string,
        @Query('jobId') jobId?: string,
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.hrService.getApplications(userId, { jobId, status, page, limit });
    }

    @Post('applications/:applicationId/reject')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HR)
    @HttpCode(HttpStatus.OK)
    async rejectApplication(
        @CurrentUser('sub') userId: string,
        @Param('applicationId') applicationId: string,
        @Body() dto: { reason?: string },
    ) {
        return this.hrService.rejectApplication(userId, applicationId, dto.reason);
    }
}
