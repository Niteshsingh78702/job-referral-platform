"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TestController", {
    enumerable: true,
    get: function() {
        return TestController;
    }
});
const _common = require("@nestjs/common");
const _testservice = require("./test.service");
const _dto = require("./dto");
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
let TestController = class TestController {
    // ===========================================
    // ADMIN: Test Management
    // ===========================================
    async createTest(dto) {
        return this.testService.createTest(dto);
    }
    async addQuestion(testId, dto) {
        return this.testService.addQuestion(testId, dto);
    }
    async getTest(testId) {
        return this.testService.getTestById(testId);
    }
    // ===========================================
    // CANDIDATE: Test Taking
    // ===========================================
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
    constructor(testService){
        this.testService = testService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateTestDto === "undefined" ? Object : _dto.CreateTestDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "createTest", null);
_ts_decorate([
    (0, _common.Post)(':testId/questions'),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Param)('testId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.AddQuestionDto === "undefined" ? Object : _dto.AddQuestionDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "addQuestion", null);
_ts_decorate([
    (0, _common.Get)(':testId'),
    (0, _decorators.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Param)('testId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "getTest", null);
_ts_decorate([
    (0, _common.Post)('application/:applicationId/start'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('applicationId')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "startTest", null);
_ts_decorate([
    (0, _common.Get)('session/:sessionId'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "getSession", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/answer'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.SubmitAnswerDto === "undefined" ? Object : _dto.SubmitAnswerDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "submitAnswer", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/submit'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "submitTest", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/event'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _dto.TestEventDto === "undefined" ? Object : _dto.TestEventDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestController.prototype, "logEvent", null);
TestController = _ts_decorate([
    (0, _common.Controller)('tests'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _testservice.TestService === "undefined" ? Object : _testservice.TestService
    ])
], TestController);

//# sourceMappingURL=test.controller.js.map