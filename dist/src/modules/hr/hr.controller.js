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
exports.HRController = void 0;
const common_1 = require("@nestjs/common");
const services_1 = require("./services");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const constants_1 = require("../../common/constants");
let HRController = class HRController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    async register(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.hrService.register(dto, deviceInfo);
    }
    async login(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.hrService.login(dto, deviceInfo);
    }
    async getProfile(userId) {
        return this.hrService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.hrService.updateProfile(userId, dto);
    }
    async getDashboardStats(userId) {
        return this.hrService.getDashboardStats(userId);
    }
    async getRecentActivity(userId, limit) {
        return this.hrService.getRecentActivity(userId, limit || 10);
    }
    async getJobs(userId, status, page, limit) {
        return this.hrService.getJobs(userId, { status, page, limit });
    }
    async createJob(userId, dto) {
        return this.hrService.createJob(userId, dto);
    }
    async getJobById(userId, jobId) {
        return this.hrService.getJobById(userId, jobId);
    }
    async updateJob(userId, jobId, dto) {
        return this.hrService.updateJob(userId, jobId, dto);
    }
    async deleteJob(userId, jobId) {
        return this.hrService.deleteJob(userId, jobId);
    }
    async updateJobStatus(userId, jobId, dto) {
        return this.hrService.updateJobStatus(userId, jobId, dto);
    }
    async getApplications(userId, jobId, status, page, limit) {
        return this.hrService.getApplications(userId, { jobId, status, page, limit });
    }
};
exports.HRController = HRController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('auth/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HRRegisterDto, Object]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "register", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HRLoginDto, Object]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateHRProfileDto]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/activity'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getRecentActivity", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateJobDto]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "createJob", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getJobById", null);
__decorate([
    (0, common_1.Put)('jobs/:jobId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateJobDto]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Delete)('jobs/:jobId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "deleteJob", null);
__decorate([
    (0, common_1.Put)('jobs/:jobId/status'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateJobStatusDto]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "updateJobStatus", null);
__decorate([
    (0, common_1.Get)('applications'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('jobId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], HRController.prototype, "getApplications", null);
exports.HRController = HRController = __decorate([
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [services_1.HRService])
], HRController);
//# sourceMappingURL=hr.controller.js.map