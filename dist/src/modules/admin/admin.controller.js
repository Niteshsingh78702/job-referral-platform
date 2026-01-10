"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getDashboard() {
        return this.adminService.getDashboardMetrics();
    }
    async getUsers(page, limit, role, status) {
        return this.adminService.getAllUsers(page, limit, role, status);
    }
    async blockUser(userId, adminId) {
        return this.adminService.blockUser(userId, adminId);
    }
    async unblockUser(userId, adminId) {
        return this.adminService.unblockUser(userId, adminId);
    }
    async getPendingHRs() {
        return this.adminService.getPendingHRApprovals();
    }
    async approveHR(hrId, adminId) {
        return this.adminService.approveHR(hrId, adminId);
    }
    async rejectHR(hrId, adminId, reason) {
        return this.adminService.rejectHR(hrId, adminId, reason);
    }
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
    async getCandidates(page, limit, search) {
        return this.adminService.getAllCandidates(page, limit, search);
    }
    async deleteUser(userId, adminId) {
        return this.adminService.deleteUser(userId, adminId);
    }
    async getPayments(page, limit, status) {
        return this.adminService.getAllPayments(page, limit, status);
    }
    async getPendingRefunds() {
        return this.adminService.getPendingRefunds();
    }
    async approveRefund(refundId, adminId, notes) {
        return this.adminService.approveRefund(refundId, adminId, notes);
    }
    async rejectRefund(refundId, adminId, reason) {
        return this.adminService.rejectRefund(refundId, adminId, reason);
    }
    async getAuditLogs(page, limit, action) {
        return this.adminService.getAuditLogs(page, limit, action);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/block'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unblock'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Get)('hr/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingHRs", null);
__decorate([
    (0, common_1.Post)('hr/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveHR", null);
__decorate([
    (0, common_1.Post)('hr/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectHR", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Post)('jobs/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveJob", null);
__decorate([
    (0, common_1.Patch)('jobs/:id/expire'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "expireJob", null);
__decorate([
    (0, common_1.Post)('jobs/create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createJob", null);
__decorate([
    (0, common_1.Patch)('jobs/:id/update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Delete)('jobs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteJob", null);
__decorate([
    (0, common_1.Get)('candidates'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCandidates", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('refunds/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingRefunds", null);
__decorate([
    (0, common_1.Post)('refunds/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveRefund", null);
__decorate([
    (0, common_1.Post)('refunds/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectRefund", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map