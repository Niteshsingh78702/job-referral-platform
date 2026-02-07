import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

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
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    // Cast string params to enum types for proper Prisma filtering
    const roleEnum = role ? (role as UserRole) : undefined;
    const statusEnum = status ? (status as UserStatus) : undefined;
    return this.adminService.getAllUsers(page, limit, roleEnum, statusEnum);
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
    @Query('status') status?: string,
  ) {
    // Cast string param to enum type for proper Prisma filtering
    const statusEnum = status ? (status as JobStatus) : undefined;
    return this.adminService.getAllJobs(page, limit, statusEnum);
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
  async createJob(@Body() jobData: any, @CurrentUser('sub') adminId: string) {
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

  // Applications
  @Get('applications')
  async getApplications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('jobId') jobId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllApplications(
      page,
      limit,
      status,
      jobId,
      search,
    );
  }

  @Patch('applications/:id/status')
  async updateApplicationStatus(
    @Param('id') applicationId: string,
    @Body('status') newStatus: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateApplicationStatus(
      applicationId,
      newStatus,
      adminId,
      reason,
    );
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
    @Query('status') status?: string,
  ) {
    // Cast string param to enum type for proper Prisma filtering
    const statusEnum = status ? (status as PaymentStatus) : undefined;
    return this.adminService.getAllPayments(page, limit, statusEnum);
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
    @Query('action') action?: string,
  ) {
    // Cast string param to enum type for proper Prisma filtering
    const actionEnum = action ? (action as AuditAction) : undefined;
    return this.adminService.getAuditLogs(page, limit, actionEnum);
  }

  // ===========================================
  // INTERVIEW MANAGEMENT
  // ===========================================

  @Get('interviews')
  async getInterviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllInterviews(page, limit, status);
  }

  @Get('interviews/stats')
  async getInterviewStats() {
    return this.adminService.getInterviewStats();
  }

  @Patch('interviews/:id/status')
  async updateInterviewStatus(
    @Param('id') interviewId: string,
    @Body('status') newStatus: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateInterviewStatus(
      interviewId,
      newStatus,
      adminId,
      reason,
    );
  }

  @Post('interviews/:id/mark-completed')
  async markInterviewCompleted(
    @Param('id') interviewId: string,
    @Body('notes') notes: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.markInterviewCompleted(
      interviewId,
      adminId,
      notes,
    );
  }

  @Post('interviews/:id/mark-no-show')
  async markInterviewNoShow(
    @Param('id') interviewId: string,
    @Body('noShowType') noShowType: 'CANDIDATE' | 'HR',
    @Body('notes') notes: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.markInterviewNoShow(
      interviewId,
      adminId,
      noShowType,
      notes,
    );
  }

  // ===========================================
  // SKILL BUCKET MANAGEMENT
  // ===========================================

  @Get('skill-buckets')
  async getSkillBuckets(@Query('includeInactive') includeInactive?: string) {
    return this.adminService.getAllSkillBuckets(includeInactive === 'true');
  }

  @Post('skill-buckets')
  async createSkillBucket(
    @Body()
    data: {
      code: string;
      name: string;
      description?: string;
      displayName?: string;
      experienceMin?: number;
      experienceMax?: number;
      testId?: string;
      testTemplateId?: string;
    },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.createSkillBucket(data, adminId);
  }

  @Patch('skill-buckets/:id')
  async updateSkillBucket(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateSkillBucket(id, data, adminId);
  }

  @Delete('skill-buckets/:id')
  async deleteSkillBucket(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.deleteSkillBucket(id, adminId);
  }

  // ===========================================
  // JOB SKILL REQUIREMENTS
  // ===========================================

  @Get('jobs/:jobId/skill-requirements')
  async getJobSkillRequirements(@Param('jobId') jobId: string) {
    return this.adminService.getJobSkillRequirements(jobId);
  }

  @Post('jobs/:jobId/skill-requirements')
  async addSkillRequirementToJob(
    @Param('jobId') jobId: string,
    @Body('skillBucketId') skillBucketId: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.addSkillRequirementToJob(
      jobId,
      skillBucketId,
      adminId,
    );
  }

  @Delete('jobs/:jobId/skill-requirements/:skillBucketId')
  async removeSkillRequirementFromJob(
    @Param('jobId') jobId: string,
    @Param('skillBucketId') skillBucketId: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.removeSkillRequirementFromJob(
      jobId,
      skillBucketId,
      adminId,
    );
  }

  // ===========================================
  // PAYMENT CONTROL
  // ===========================================

  @Patch('payments/:id/status')
  async updatePaymentStatus(
    @Param('id') paymentId: string,
    @Body('status') newStatus: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updatePaymentStatus(
      paymentId,
      newStatus,
      adminId,
      reason,
    );
  }

  @Post('payments/:id/manual-refund')
  async issueManualRefund(
    @Param('id') paymentId: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.issueManualRefund(paymentId, adminId, reason);
  }

  // ===========================================
  // REVENUE & ANALYTICS
  // ===========================================

  @Get('revenue-report')
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics')
  async getEnhancedAnalytics() {
    return this.adminService.getEnhancedAnalytics();
  }

  // ===========================================
  // TEST OVERRIDE CONTROLS (ADMIN POWER FEATURES)
  // ===========================================

  @Post('skill-tests/pass')
  async manuallyPassTest(
    @Body('candidateId') candidateId: string,
    @Body('skillBucketId') skillBucketId: string,
    @Body('reason') reason: string,
    @Body('validityDays') validityDays: number,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.manuallyPassTest(
      candidateId,
      skillBucketId,
      adminId,
      reason,
      validityDays,
    );
  }

  @Post('skill-tests/fail')
  async manuallyFailTest(
    @Body('candidateId') candidateId: string,
    @Body('skillBucketId') skillBucketId: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.manuallyFailTest(
      candidateId,
      skillBucketId,
      adminId,
      reason,
    );
  }

  @Patch('skill-tests/:attemptId/extend-validity')
  async extendTestValidity(
    @Param('attemptId') attemptId: string,
    @Body('newValidTill') newValidTill: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.extendTestValidity(
      attemptId,
      new Date(newValidTill),
      adminId,
      reason,
    );
  }

  @Patch('skill-tests/:attemptId/reset-cooldown')
  async resetRetestCooldown(
    @Param('attemptId') attemptId: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.resetRetestCooldown(attemptId, adminId, reason);
  }

  // ===========================================
  // FRAUD DETECTION
  // ===========================================

  @Get('fraud/suspicious-activities')
  async getSuspiciousActivities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isReviewed') isReviewed?: string,
    @Query('activityType') activityType?: string,
  ) {
    return this.adminService.getSuspiciousActivities(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      isReviewed !== undefined ? isReviewed === 'true' : undefined,
      activityType,
    );
  }

  @Post('fraud/suspicious-activities/:id/review')
  async reviewSuspiciousActivity(
    @Param('id') activityId: string,
    @Body('action') action: 'dismiss' | 'block_user',
    @Body('notes') notes: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.reviewSuspiciousActivity(
      activityId,
      adminId,
      action,
      notes,
    );
  }

  @Get('fraud/hr-metrics')
  async getHRFraudMetrics() {
    return this.adminService.getHRFraudMetrics();
  }

  // ===========================================
  // TESTIMONIAL MANAGEMENT
  // ===========================================

  @Get('testimonials')
  async getTestimonials(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllTestimonials(page, limit);
  }

  @Post('testimonials')
  async createTestimonial(
    @Body()
    data: {
      candidateName: string;
      role: string;
      company: string;
      interviewDate: string;
      quote: string;
      imageUrl?: string;
      rating?: number;
      displayOrder?: number;
    },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.createTestimonial(data, adminId);
  }

  @Patch('testimonials/:id')
  async updateTestimonial(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateTestimonial(id, data, adminId);
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.deleteTestimonial(id, adminId);
  }

  @Patch('testimonials/:id/toggle')
  async toggleTestimonialStatus(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.toggleTestimonialStatus(id, adminId);
  }

  @Post('testimonials/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadTestimonialImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, and WEBP images are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    try {
      const result = await this.cloudinaryService.uploadTestimonialImage(file);
      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.url,
          publicId: result.publicId,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image: ' + error.message);
    }
  }

  // ==========================================
  // SITE SETTINGS
  // ==========================================

  @Get('settings')
  async getSettings() {
    return this.adminService.getAllSettings();
  }

  @Patch('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() data: { value: string; label?: string },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.updateSetting(key, data.value, data.label, adminId);
  }

  @Post('settings/initialize')
  async initializeSettings() {
    return this.adminService.initializeDefaultSettings();
  }
}

