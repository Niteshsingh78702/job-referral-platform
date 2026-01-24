"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InterviewController", {
    enumerable: true,
    get: function() {
        return InterviewController;
    }
});
const _common = require("@nestjs/common");
const _interviewservice = require("./interview.service");
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
let InterviewController = class InterviewController {
    // ===========================================
    // HR Endpoints
    // ===========================================
    /**
     * HR confirms an interview with date/time/mode.
     * NEW FLOW: HR provides all details upfront, candidate pays to unlock.
     */ async confirmInterview(userId, applicationId, dto) {
        return this.interviewService.confirmInterview(userId, applicationId, dto);
    }
    /**
     * Get all interviews for HR's jobs
     */ async getHRInterviews(userId, status, jobId) {
        return this.interviewService.getHRInterviews(userId, {
            status,
            jobId
        });
    }
    // ===========================================
    // Candidate Endpoints
    // ===========================================
    /**
     * Get all interviews for candidate
     */ async getCandidateInterviews(userId) {
        return this.interviewService.getCandidateInterviews(userId);
    }
    /**
     * Get specific interview for candidate
     * Returns filtered data based on interview status
     */ async getInterviewForCandidate(userId, interviewId) {
        return this.interviewService.getInterviewForCandidate(userId, interviewId);
    }
    // ===========================================
    // Admin Endpoints
    // ===========================================
    /**
     * Get interview statistics for admin dashboard
     */ async getAdminStats() {
        return this.interviewService.getAdminInterviewStats();
    }
    /**
     * Get all interviews for admin with pagination
     */ async getAdminInterviews(page, limit, status) {
        return this.interviewService.getAdminInterviews(page || 1, limit || 20, status);
    }
    /**
     * Admin marks interview as no-show (candidate or HR)
     */ async markNoShow(adminUserId, interviewId, type) {
        return this.interviewService.markNoShow(interviewId, type, adminUserId);
    }
    /**
     * Admin marks interview as completed
     */ async markCompleted(adminUserId, interviewId) {
        return this.interviewService.markCompleted(interviewId, adminUserId);
    }
    /**
     * HR marks interview outcome (Selected/Not Selected/No Show)
     */ async markInterviewOutcome(userId, interviewId, dto) {
        return this.interviewService.markInterviewOutcome(userId, interviewId, dto);
    }
    constructor(interviewService){
        this.interviewService = interviewService;
    }
};
_ts_decorate([
    (0, _common.Post)('confirm/:applicationId'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('applicationId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.ConfirmInterviewDto === "undefined" ? Object : _dto.ConfirmInterviewDto
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "confirmInterview", null);
_ts_decorate([
    (0, _common.Get)('hr'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_param(2, (0, _common.Query)('jobId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "getHRInterviews", null);
_ts_decorate([
    (0, _common.Get)('candidate'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "getCandidateInterviews", null);
_ts_decorate([
    (0, _common.Get)('candidate/:interviewId'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('interviewId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "getInterviewForCandidate", null);
_ts_decorate([
    (0, _common.Get)('admin/stats'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "getAdminStats", null);
_ts_decorate([
    (0, _common.Get)('admin'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
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
], InterviewController.prototype, "getAdminInterviews", null);
_ts_decorate([
    (0, _common.Post)('admin/:interviewId/no-show'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('interviewId')),
    _ts_param(2, (0, _common.Body)('type')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "markNoShow", null);
_ts_decorate([
    (0, _common.Post)('admin/:interviewId/complete'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('interviewId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "markCompleted", null);
_ts_decorate([
    (0, _common.Post)(':interviewId/outcome'),
    (0, _common.UseGuards)(_guards.RolesGuard),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('interviewId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], InterviewController.prototype, "markInterviewOutcome", null);
InterviewController = _ts_decorate([
    (0, _common.Controller)('interviews'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _interviewservice.InterviewService === "undefined" ? Object : _interviewservice.InterviewService
    ])
], InterviewController);

//# sourceMappingURL=interview.controller.js.map