import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles, CurrentUser } from '../../common/decorators';
import {
    UserRole,
    UserStatus,
    JobStatus,
    PaymentStatus,
    AuditAction,
} from '../../common/constants';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Dashboard
    @Get('dashboard')
    async getDashboard() {
        return this.adminService.getDashboardMetrics();
    }

    // Users
    @Get('users')
    async getUsers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('role') role?: UserRole,
        @Query('status') status?: UserStatus,
    ) {
        return this.adminService.getAllUsers(page, limit, role, status);
    }

    @Patch('users/:id/block')
    async blockUser(
        @Param('id') userId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.blockUser(userId, adminId);
    }

    @Patch('users/:id/unblock')
    async unblockUser(
        @Param('id') userId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.unblockUser(userId, adminId);
    }

    // HR Approvals
    @Get('hr/pending')
    async getPendingHRs() {
        return this.adminService.getPendingHRApprovals();
    }

    @Post('hr/:id/approve')
    async approveHR(
        @Param('id') hrId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.approveHR(hrId, adminId);
    }

    @Post('hr/:id/reject')
    async rejectHR(
        @Param('id') hrId: string,
        @CurrentUser('sub') adminId: string,
        @Body('reason') reason: string,
    ) {
        return this.adminService.rejectHR(hrId, adminId, reason);
    }

    // Jobs
    @Get('jobs')
    async getJobs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: JobStatus,
    ) {
        return this.adminService.getAllJobs(page, limit, status);
    }

    @Post('jobs/:id/approve')
    async approveJob(
        @Param('id') jobId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.approveJob(jobId, adminId);
    }

    @Patch('jobs/:id/expire')
    async expireJob(
        @Param('id') jobId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.expireJob(jobId, adminId);
    }

    @Post('jobs/create')
    async createJob(
        @Body() jobData: any,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.createJob(jobData, adminId);
    }

    @Patch('jobs/:id/update')
    async updateJob(
        @Param('id') jobId: string,
        @Body() jobData: any,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.updateJob(jobId, jobData, adminId);
    }

    @Delete('jobs/:id')
    async deleteJob(
        @Param('id') jobId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.deleteJob(jobId, adminId);
    }

    // Candidates
    @Get('candidates')
    async getCandidates(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
    ) {
        return this.adminService.getAllCandidates(page, limit, search);
    }

    @Delete('users/:id')
    async deleteUser(
        @Param('id') userId: string,
        @CurrentUser('sub') adminId: string,
    ) {
        return this.adminService.deleteUser(userId, adminId);
    }

    // Payments
    @Get('payments')
    async getPayments(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: PaymentStatus,
    ) {
        return this.adminService.getAllPayments(page, limit, status);
    }

    // Refunds
    @Get('refunds/pending')
    async getPendingRefunds() {
        return this.adminService.getPendingRefunds();
    }

    @Post('refunds/:id/approve')
    async approveRefund(
        @Param('id') refundId: string,
        @CurrentUser('sub') adminId: string,
        @Body('notes') notes?: string,
    ) {
        return this.adminService.approveRefund(refundId, adminId, notes);
    }

    @Post('refunds/:id/reject')
    async rejectRefund(
        @Param('id') refundId: string,
        @CurrentUser('sub') adminId: string,
        @Body('reason') reason: string,
    ) {
        return this.adminService.rejectRefund(refundId, adminId, reason);
    }

    // Audit Logs
    @Get('audit-logs')
    async getAuditLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('action') action?: AuditAction,
    ) {
        return this.adminService.getAuditLogs(page, limit, action);
    }
}
