"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminController", {
    enumerable: true,
    get: function() {
        return AdminController;
    }
});
const _common = require("@nestjs/common");
const _adminservice = require("./admin.service");
const _decorators = require("../../common/decorators");
const _constants = require("../../common/constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AdminController = class AdminController {
    // Dashboard
    async getDashboard() {
        return this.adminService.getDashboardMetrics();
    }
    // Users
    async getUsers(page, limit, role, status) {
        return this.adminService.getAllUsers(page, limit, role, status);
    }
    async blockUser(userId, adminId) {
        return this.adminService.blockUser(userId, adminId);
    }
    async unblockUser(userId, adminId) {
        return this.adminService.unblockUser(userId, adminId);
    }
    // HR Approvals
    async getPendingHRs() {
        return this.adminService.getPendingHRApprovals();
    }
    async approveHR(hrId, adminId) {
        return this.adminService.approveHR(hrId, adminId);
    }
    async rejectHR(hrId, adminId, reason) {
        return this.adminService.rejectHR(hrId, adminId, reason);
    }
    // Jobs
    async getJobs(page, limit, status) {
        return this.adminService.getAllJobs(page, limit, status);
    }
    async approveJob(jobId, adminId) {
        return this.adminService.approveJob(jobId, adminId);
    }
    async expireJob(jobId, adminId) {
        return this.adminService.expireJob(jobId, adminId);
    }
    async createJob(jobData, adminId) {
        return this.adminService.createJob(jobData, adminId);
    }
    async updateJob(jobId, jobData, adminId) {
        return this.adminService.updateJob(jobId, jobData, adminId);
    }
    async deleteJob(jobId, adminId) {
        return this.adminService.deleteJob(jobId, adminId);
    }
    // Applications
    async getApplications(page, limit, status, jobId, search) {
        return this.adminService.getAllApplications(page, limit, status, jobId, search);
    }
    async updateApplicationStatus(applicationId, newStatus, reason, adminId) {
        return this.adminService.updateApplicationStatus(applicationId, newStatus, adminId, reason);
    }
    // Candidates
    async getCandidates(page, limit, search) {
        return this.adminService.getAllCandidates(page, limit, search);
    }
    async deleteUser(userId, adminId) {
        return this.adminService.deleteUser(userId, adminId);
    }
    // Payments
    async getPayments(page, limit, status) {
        return this.adminService.getAllPayments(page, limit, status);
    }
    // Refunds
    async getPendingRefunds() {
        return this.adminService.getPendingRefunds();
    }
    async approveRefund(refundId, adminId, notes) {
        return this.adminService.approveRefund(refundId, adminId, notes);
    }
    async rejectRefund(refundId, adminId, reason) {
        return this.adminService.rejectRefund(refundId, adminId, reason);
    }
    // Audit Logs
    async getAuditLogs(page, limit, action) {
        return this.adminService.getAuditLogs(page, limit, action);
    }
    // ===========================================
    // INTERVIEW MANAGEMENT
    // ===========================================
    async getInterviews(page, limit, status) {
        return this.adminService.getAllInterviews(page, limit, status);
    }
    async getInterviewStats() {
        return this.adminService.getInterviewStats();
    }
    async updateInterviewStatus(interviewId, newStatus, reason, adminId) {
        return this.adminService.updateInterviewStatus(interviewId, newStatus, adminId, reason);
    }
    async markInterviewCompleted(interviewId, notes, adminId) {
        return this.adminService.markInterviewCompleted(interviewId, adminId, notes);
    }
    async markInterviewNoShow(interviewId, noShowType, notes, adminId) {
        return this.adminService.markInterviewNoShow(interviewId, adminId, noShowType, notes);
    }
    // ===========================================
    // SKILL BUCKET MANAGEMENT
    // ===========================================
    async getSkillBuckets(includeInactive) {
        return this.adminService.getAllSkillBuckets(includeInactive === 'true');
    }
    async createSkillBucket(data, adminId) {
        return this.adminService.createSkillBucket(data, adminId);
    }
    async updateSkillBucket(id, data, adminId) {
        return this.adminService.updateSkillBucket(id, data, adminId);
    }
    async deleteSkillBucket(id, adminId) {
        return this.adminService.deleteSkillBucket(id, adminId);
    }
    // ===========================================
    // JOB SKILL REQUIREMENTS
    // ===========================================
    async getJobSkillRequirements(jobId) {
        return this.adminService.getJobSkillRequirements(jobId);
    }
    async addSkillRequirementToJob(jobId, skillBucketId, adminId) {
        return this.adminService.addSkillRequirementToJob(jobId, skillBucketId, adminId);
    }
    async removeSkillRequirementFromJob(jobId, skillBucketId, adminId) {
        return this.adminService.removeSkillRequirementFromJob(jobId, skillBucketId, adminId);
    }
    // ===========================================
    // PAYMENT CONTROL
    // ===========================================
    async updatePaymentStatus(paymentId, newStatus, reason, adminId) {
        return this.adminService.updatePaymentStatus(paymentId, newStatus, adminId, reason);
    }
    async issueManualRefund(paymentId, reason, adminId) {
        return this.adminService.issueManualRefund(paymentId, adminId, reason);
    }
    // ===========================================
    // REVENUE & ANALYTICS
    // ===========================================
    async getRevenueReport(startDate, endDate) {
        return this.adminService.getRevenueReport(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    async getEnhancedAnalytics() {
        return this.adminService.getEnhancedAnalytics();
    }
    // ===========================================
    // TEST OVERRIDE CONTROLS (ADMIN POWER FEATURES)
    // ===========================================
    async manuallyPassTest(candidateId, skillBucketId, reason, validityDays, adminId) {
        return this.adminService.manuallyPassTest(candidateId, skillBucketId, adminId, reason, validityDays);
    }
    async manuallyFailTest(candidateId, skillBucketId, reason, adminId) {
        return this.adminService.manuallyFailTest(candidateId, skillBucketId, adminId, reason);
    }
    async extendTestValidity(attemptId, newValidTill, reason, adminId) {
        return this.adminService.extendTestValidity(attemptId, new Date(newValidTill), adminId, reason);
    }
    async resetRetestCooldown(attemptId, reason, adminId) {
        return this.adminService.resetRetestCooldown(attemptId, adminId, reason);
    }
    // ===========================================
    // FRAUD DETECTION
    // ===========================================
    async getSuspiciousActivities(page, limit, isReviewed, activityType) {
        return this.adminService.getSuspiciousActivities(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, isReviewed !== undefined ? isReviewed === 'true' : undefined, activityType);
    }
    async reviewSuspiciousActivity(activityId, action, notes, adminId) {
        return this.adminService.reviewSuspiciousActivity(activityId, adminId, action, notes);
    }
    async getHRFraudMetrics() {
        return this.adminService.getHRFraudMetrics();
    }
    constructor(adminService){
        this.adminService = adminService;
    }
};
_ts_decorate([
    (0, _common.Get)('dashboard'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('users'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('role')),
    _ts_param(3, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
_ts_decorate([
    (0, _common.Patch)('users/:id/block'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "blockUser", null);
_ts_decorate([
    (0, _common.Patch)('users/:id/unblock'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "unblockUser", null);
_ts_decorate([
    (0, _common.Get)('hr/pending'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingHRs", null);
_ts_decorate([
    (0, _common.Post)('hr/:id/approve'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "approveHR", null);
_ts_decorate([
    (0, _common.Post)('hr/:id/reject'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "rejectHR", null);
_ts_decorate([
    (0, _common.Get)('jobs'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getJobs", null);
_ts_decorate([
    (0, _common.Post)('jobs/:id/approve'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "approveJob", null);
_ts_decorate([
    (0, _common.Patch)('jobs/:id/expire'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "expireJob", null);
_ts_decorate([
    (0, _common.Post)('jobs/create'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "createJob", null);
_ts_decorate([
    (0, _common.Patch)('jobs/:id/update'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "updateJob", null);
_ts_decorate([
    (0, _common.Delete)('jobs/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "deleteJob", null);
_ts_decorate([
    (0, _common.Get)('applications'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_param(3, (0, _common.Query)('jobId')),
    _ts_param(4, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getApplications", null);
_ts_decorate([
    (0, _common.Patch)('applications/:id/status'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('status')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "updateApplicationStatus", null);
_ts_decorate([
    (0, _common.Get)('candidates'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getCandidates", null);
_ts_decorate([
    (0, _common.Delete)('users/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
_ts_decorate([
    (0, _common.Get)('payments'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getPayments", null);
_ts_decorate([
    (0, _common.Get)('refunds/pending'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingRefunds", null);
_ts_decorate([
    (0, _common.Post)('refunds/:id/approve'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('notes')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "approveRefund", null);
_ts_decorate([
    (0, _common.Post)('refunds/:id/reject'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "rejectRefund", null);
_ts_decorate([
    (0, _common.Get)('audit-logs'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('action')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
_ts_decorate([
    (0, _common.Get)('interviews'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getInterviews", null);
_ts_decorate([
    (0, _common.Get)('interviews/stats'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getInterviewStats", null);
_ts_decorate([
    (0, _common.Patch)('interviews/:id/status'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('status')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "updateInterviewStatus", null);
_ts_decorate([
    (0, _common.Post)('interviews/:id/mark-completed'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('notes')),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "markInterviewCompleted", null);
_ts_decorate([
    (0, _common.Post)('interviews/:id/mark-no-show'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('noShowType')),
    _ts_param(2, (0, _common.Body)('notes')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "markInterviewNoShow", null);
_ts_decorate([
    (0, _common.Get)('skill-buckets'),
    _ts_param(0, (0, _common.Query)('includeInactive')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getSkillBuckets", null);
_ts_decorate([
    (0, _common.Post)('skill-buckets'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "createSkillBucket", null);
_ts_decorate([
    (0, _common.Patch)('skill-buckets/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "updateSkillBucket", null);
_ts_decorate([
    (0, _common.Delete)('skill-buckets/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSkillBucket", null);
_ts_decorate([
    (0, _common.Get)('jobs/:jobId/skill-requirements'),
    _ts_param(0, (0, _common.Param)('jobId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getJobSkillRequirements", null);
_ts_decorate([
    (0, _common.Post)('jobs/:jobId/skill-requirements'),
    _ts_param(0, (0, _common.Param)('jobId')),
    _ts_param(1, (0, _common.Body)('skillBucketId')),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "addSkillRequirementToJob", null);
_ts_decorate([
    (0, _common.Delete)('jobs/:jobId/skill-requirements/:skillBucketId'),
    _ts_param(0, (0, _common.Param)('jobId')),
    _ts_param(1, (0, _common.Param)('skillBucketId')),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "removeSkillRequirementFromJob", null);
_ts_decorate([
    (0, _common.Patch)('payments/:id/status'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('status')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "updatePaymentStatus", null);
_ts_decorate([
    (0, _common.Post)('payments/:id/manual-refund'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('reason')),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "issueManualRefund", null);
_ts_decorate([
    (0, _common.Get)('revenue-report'),
    _ts_param(0, (0, _common.Query)('startDate')),
    _ts_param(1, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueReport", null);
_ts_decorate([
    (0, _common.Get)('analytics'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getEnhancedAnalytics", null);
_ts_decorate([
    (0, _common.Post)('skill-tests/pass'),
    _ts_param(0, (0, _common.Body)('candidateId')),
    _ts_param(1, (0, _common.Body)('skillBucketId')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _common.Body)('validityDays')),
    _ts_param(4, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "manuallyPassTest", null);
_ts_decorate([
    (0, _common.Post)('skill-tests/fail'),
    _ts_param(0, (0, _common.Body)('candidateId')),
    _ts_param(1, (0, _common.Body)('skillBucketId')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "manuallyFailTest", null);
_ts_decorate([
    (0, _common.Patch)('skill-tests/:attemptId/extend-validity'),
    _ts_param(0, (0, _common.Param)('attemptId')),
    _ts_param(1, (0, _common.Body)('newValidTill')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "extendTestValidity", null);
_ts_decorate([
    (0, _common.Patch)('skill-tests/:attemptId/reset-cooldown'),
    _ts_param(0, (0, _common.Param)('attemptId')),
    _ts_param(1, (0, _common.Body)('reason')),
    _ts_param(2, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "resetRetestCooldown", null);
_ts_decorate([
    (0, _common.Get)('fraud/suspicious-activities'),
    _ts_param(0, (0, _common.Query)('page')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_param(2, (0, _common.Query)('isReviewed')),
    _ts_param(3, (0, _common.Query)('activityType')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getSuspiciousActivities", null);
_ts_decorate([
    (0, _common.Post)('fraud/suspicious-activities/:id/review'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('action')),
    _ts_param(2, (0, _common.Body)('notes')),
    _ts_param(3, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "reviewSuspiciousActivity", null);
_ts_decorate([
    (0, _common.Get)('fraud/hr-metrics'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "getHRFraudMetrics", null);
AdminController = _ts_decorate([
    (0, _common.Controller)('admin'),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adminservice.AdminService === "undefined" ? Object : _adminservice.AdminService
    ])
], AdminController);

//# sourceMappingURL=admin.controller.js.map