"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HRController", {
    enumerable: true,
    get: function() {
        return HRController;
    }
});
const _common = require("@nestjs/common");
const _services = require("./services");
const _dto = require("./dto");
const _decorators = require("../../common/decorators");
const _guards = require("../../common/guards");
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
let HRController = class HRController {
    // ==========================================
    // Public Routes (No Auth Required)
    // ==========================================
    async register(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id']
        };
        return this.hrService.register(dto, deviceInfo);
    }
    async login(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id']
        };
        return this.hrService.login(dto, deviceInfo);
    }
    // ==========================================
    // Protected Routes (HR Only)
    // ==========================================
    async getProfile(userId) {
        return this.hrService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.hrService.updateProfile(userId, dto);
    }
    // ==========================================
    // Dashboard Routes
    // ==========================================
    async getDashboardStats(userId) {
        return this.hrService.getDashboardStats(userId);
    }
    async getRecentActivity(userId, limit) {
        return this.hrService.getRecentActivity(userId, limit || 10);
    }
    // ==========================================
    // Job Management Routes
    // ==========================================
    async getJobs(userId, status, page, limit) {
        return this.hrService.getJobs(userId, {
            status,
            page,
            limit
        });
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
    // ==========================================
    // Application Management Routes
    // ==========================================
    async getApplications(userId, jobId, status, page, limit) {
        return this.hrService.getApplications(userId, {
            jobId,
            status,
            page,
            limit
        });
    }
    async rejectApplication(userId, applicationId, dto) {
        return this.hrService.rejectApplication(userId, applicationId, dto.reason);
    }
    constructor(hrService){
        this.hrService = hrService;
    }
};
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('auth/register'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.HRRegisterDto === "undefined" ? Object : _dto.HRRegisterDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "register", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('auth/login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.HRLoginDto === "undefined" ? Object : _dto.HRLoginDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "login", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateHRProfileDto === "undefined" ? Object : _dto.UpdateHRProfileDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Get)('dashboard/stats'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getDashboardStats", null);
_ts_decorate([
    (0, _common.Get)('dashboard/activity'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getRecentActivity", null);
_ts_decorate([
    (0, _common.Get)('jobs'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_param(2, (0, _common.Query)('page')),
    _ts_param(3, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getJobs", null);
_ts_decorate([
    (0, _common.Post)('jobs'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.CreateJobDto === "undefined" ? Object : _dto.CreateJobDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "createJob", null);
_ts_decorate([
    (0, _common.Get)('jobs/:jobId'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('jobId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getJobById", null);
_ts_decorate([
    (0, _common.Put)('jobs/:jobId'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('jobId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.UpdateJobDto === "undefined" ? Object : _dto.UpdateJobDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "updateJob", null);
_ts_decorate([
    (0, _common.Delete)('jobs/:jobId'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('jobId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "deleteJob", null);
_ts_decorate([
    (0, _common.Put)('jobs/:jobId/status'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('jobId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.UpdateJobStatusDto === "undefined" ? Object : _dto.UpdateJobStatusDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "updateJobStatus", null);
_ts_decorate([
    (0, _common.Get)('applications'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('jobId')),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "getApplications", null);
_ts_decorate([
    (0, _common.Post)('applications/:applicationId/reject'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('applicationId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HRController.prototype, "rejectApplication", null);
HRController = _ts_decorate([
    (0, _common.Controller)('hr'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _services.HRService === "undefined" ? Object : _services.HRService
    ])
], HRController);

//# sourceMappingURL=hr.controller.js.map