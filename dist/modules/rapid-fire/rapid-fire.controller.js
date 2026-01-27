"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RapidFireController", {
    enumerable: true,
    get: function() {
        return RapidFireController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../../common/guards/jwt-auth.guard");
const _rolesguard = require("../../common/guards/roles.guard");
const _rolesdecorator = require("../../common/decorators/roles.decorator");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
const _constants = require("../../common/constants");
const _rapidfireservice = require("./rapid-fire.service");
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
let RapidFireController = class RapidFireController {
    /**
   * Check if candidate can take a test for a skill bucket
   */ async checkEligibility(skillBucketId, user) {
        // Get candidate from user
        const eligibility = await this.rapidFireService.canTakeTest(user.candidateId, skillBucketId);
        return {
            success: true,
            data: eligibility
        };
    }
    /**
   * Start a rapid fire test
   */ async startTest(skillBucketId, user) {
        const result = await this.rapidFireService.startTest(user.sub, user.candidateId, skillBucketId);
        return {
            success: true,
            message: 'Test started! Good luck!',
            data: result
        };
    }
    /**
   * Get current test state with all questions
   */ async getTestState(sessionId, user) {
        const state = await this.rapidFireService.getTestState(sessionId, user.sub);
        return {
            success: true,
            data: state
        };
    }
    /**
   * Submit answer for a question
   */ async submitAnswer(sessionId, body, user) {
        const result = await this.rapidFireService.submitAnswer(sessionId, user.sub, body.questionId, body.selectedAnswer);
        return {
            success: true,
            data: result
        };
    }
    /**
   * Submit the entire test
   */ async submitTest(sessionId, user) {
        const result = await this.rapidFireService.submitTest(sessionId, user.sub);
        return {
            success: true,
            data: result
        };
    }
    /**
   * Exit test (marks as failed)
   */ async exitTest(sessionId, user) {
        const result = await this.rapidFireService.exitTest(sessionId, user.sub);
        return {
            success: true,
            data: result
        };
    }
    /**
   * Get test history for current candidate
   */ async getTestHistory(user) {
        const history = await this.rapidFireService.getTestHistory(user.candidateId);
        return {
            success: true,
            data: history
        };
    }
    constructor(rapidFireService){
        this.rapidFireService = rapidFireService;
    }
};
_ts_decorate([
    (0, _common.Get)('eligibility/:skillBucketId'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('skillBucketId')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "checkEligibility", null);
_ts_decorate([
    (0, _common.Post)('start/:skillBucketId'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('skillBucketId')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "startTest", null);
_ts_decorate([
    (0, _common.Get)('session/:sessionId'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "getTestState", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/answer'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "submitAnswer", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/submit'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "submitTest", null);
_ts_decorate([
    (0, _common.Post)('session/:sessionId/exit'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _common.Param)('sessionId')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "exitTest", null);
_ts_decorate([
    (0, _common.Get)('history'),
    (0, _rolesdecorator.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], RapidFireController.prototype, "getTestHistory", null);
RapidFireController = _ts_decorate([
    (0, _common.Controller)('rapid-fire'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rapidfireservice.RapidFireTestService === "undefined" ? Object : _rapidfireservice.RapidFireTestService
    ])
], RapidFireController);

//# sourceMappingURL=rapid-fire.controller.js.map