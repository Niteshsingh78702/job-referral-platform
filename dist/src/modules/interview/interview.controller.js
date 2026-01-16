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
exports.InterviewController = void 0;
const common_1 = require("@nestjs/common");
const interview_service_1 = require("./interview.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const constants_1 = require("../../common/constants");
let InterviewController = class InterviewController {
    interviewService;
    constructor(interviewService) {
        this.interviewService = interviewService;
    }
    async confirmInterview(userId, applicationId, dto) {
        return this.interviewService.confirmInterview(userId, applicationId, dto);
    }
    async getHRInterviews(userId, status, jobId) {
        return this.interviewService.getHRInterviews(userId, { status, jobId });
    }
    async getCandidateInterviews(userId) {
        return this.interviewService.getCandidateInterviews(userId);
    }
    async getInterviewForCandidate(userId, interviewId) {
        return this.interviewService.getInterviewForCandidate(userId, interviewId);
    }
    async getAdminStats() {
        return this.interviewService.getAdminInterviewStats();
    }
    async getAdminInterviews(page, limit, status) {
        return this.interviewService.getAdminInterviews(page || 1, limit || 20, status);
    }
    async markNoShow(adminUserId, interviewId, type) {
        return this.interviewService.markNoShow(interviewId, type, adminUserId);
    }
    async markCompleted(adminUserId, interviewId) {
        return this.interviewService.markCompleted(interviewId, adminUserId);
    }
};
exports.InterviewController = InterviewController;
__decorate([
    (0, common_1.Post)('confirm/:applicationId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ConfirmInterviewDto]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "confirmInterview", null);
__decorate([
    (0, common_1.Get)('hr'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getHRInterviews", null);
__decorate([
    (0, common_1.Get)('candidate'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getCandidateInterviews", null);
__decorate([
    (0, common_1.Get)('candidate/:interviewId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getInterviewForCandidate", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getAdminStats", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getAdminInterviews", null);
__decorate([
    (0, common_1.Post)('admin/:interviewId/no-show'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Body)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "markNoShow", null);
__decorate([
    (0, common_1.Post)('admin/:interviewId/complete'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "markCompleted", null);
exports.InterviewController = InterviewController = __decorate([
    (0, common_1.Controller)('interviews'),
    __metadata("design:paramtypes", [interview_service_1.InterviewService])
], InterviewController);
//# sourceMappingURL=interview.controller.js.map