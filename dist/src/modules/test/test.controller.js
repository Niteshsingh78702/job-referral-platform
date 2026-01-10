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
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const test_service_1 = require("./test.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let TestController = class TestController {
    testService;
    constructor(testService) {
        this.testService = testService;
    }
    async createTest(dto) {
        return this.testService.createTest(dto);
    }
    async addQuestion(testId, dto) {
        return this.testService.addQuestion(testId, dto);
    }
    async getTest(testId) {
        return this.testService.getTestById(testId);
    }
    async startTest(applicationId, userId) {
        return this.testService.startTest(applicationId, userId);
    }
    async getSession(sessionId, userId) {
        return this.testService.getTestSession(sessionId, userId);
    }
    async submitAnswer(sessionId, userId, dto) {
        return this.testService.submitAnswer(sessionId, userId, dto);
    }
    async submitTest(sessionId, userId) {
        return this.testService.submitTest(sessionId, userId);
    }
    async logEvent(sessionId, userId, dto) {
        return this.testService.logTestEvent(sessionId, userId, dto);
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTestDto]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "createTest", null);
__decorate([
    (0, common_1.Post)(':testId/questions'),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddQuestionDto]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Get)(':testId'),
    (0, decorators_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "getTest", null);
__decorate([
    (0, common_1.Post)('application/:applicationId/start'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('applicationId')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "startTest", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/answer'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.SubmitAnswerDto]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/submit'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "submitTest", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/event'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.TestEventDto]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "logEvent", null);
exports.TestController = TestController = __decorate([
    (0, common_1.Controller)('tests'),
    __metadata("design:paramtypes", [test_service_1.TestService])
], TestController);
//# sourceMappingURL=test.controller.js.map