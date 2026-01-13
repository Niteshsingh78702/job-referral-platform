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
exports.RapidFireController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const rapid_fire_service_1 = require("./rapid-fire.service");
let RapidFireController = class RapidFireController {
    rapidFireService;
    constructor(rapidFireService) {
        this.rapidFireService = rapidFireService;
    }
    async checkEligibility(skillBucketId, user) {
        const eligibility = await this.rapidFireService.canTakeTest(user.candidateId, skillBucketId);
        return {
            success: true,
            data: eligibility,
        };
    }
    async startTest(skillBucketId, user) {
        const result = await this.rapidFireService.startTest(user.sub, user.candidateId, skillBucketId);
        return {
            success: true,
            message: 'Test started! Good luck!',
            data: result,
        };
    }
    async getTestState(sessionId, user) {
        const state = await this.rapidFireService.getTestState(sessionId, user.sub);
        return {
            success: true,
            data: state,
        };
    }
    async submitAnswer(sessionId, body, user) {
        const result = await this.rapidFireService.submitAnswer(sessionId, user.sub, body.questionId, body.selectedAnswer);
        return {
            success: true,
            data: result,
        };
    }
    async submitTest(sessionId, user) {
        const result = await this.rapidFireService.submitTest(sessionId, user.sub);
        return {
            success: true,
            data: result,
        };
    }
    async exitTest(sessionId, user) {
        const result = await this.rapidFireService.exitTest(sessionId, user.sub);
        return {
            success: true,
            data: result,
        };
    }
    async getTestHistory(user) {
        const history = await this.rapidFireService.getTestHistory(user.candidateId);
        return {
            success: true,
            data: history,
        };
    }
};
exports.RapidFireController = RapidFireController;
__decorate([
    (0, common_1.Get)('eligibility/:skillBucketId'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('skillBucketId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "checkEligibility", null);
__decorate([
    (0, common_1.Post)('start/:skillBucketId'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('skillBucketId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "startTest", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "getTestState", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/answer'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/submit'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "submitTest", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/exit'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "exitTest", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RapidFireController.prototype, "getTestHistory", null);
exports.RapidFireController = RapidFireController = __decorate([
    (0, common_1.Controller)('rapid-fire'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [rapid_fire_service_1.RapidFireTestService])
], RapidFireController);
//# sourceMappingURL=rapid-fire.controller.js.map