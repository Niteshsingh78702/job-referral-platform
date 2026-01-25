"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QuestionBankController", {
    enumerable: true,
    get: function() {
        return QuestionBankController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../../common/guards/jwt-auth.guard");
const _rolesguard = require("../../common/guards/roles.guard");
const _rolesdecorator = require("../../common/decorators/roles.decorator");
const _constants = require("../../common/constants");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
const _questionbankservice = require("./question-bank.service");
const _dto = require("./dto");
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
let QuestionBankController = class QuestionBankController {
    /**
     * Create a new question
     */ async createQuestion(dto, user) {
        const question = await this.questionBankService.createQuestion(dto, user.sub);
        return {
            success: true,
            message: 'Question created successfully',
            data: question
        };
    }
    /**
     * Bulk upload questions from CSV
     */ async bulkUpload(dto, user) {
        const result = await this.questionBankService.bulkUpload(dto.QuestionBank, user.sub);
        return {
            success: true,
            message: `Uploaded ${result.success} questions, ${result.failed} failed`,
            data: result
        };
    }
    /**
     * Get questions with filters and pagination
     */ async getQuestions(filters) {
        const result = await this.questionBankService.getQuestions(filters);
        return {
            success: true,
            data: result.questions,
            pagination: result.pagination
        };
    }
    /**
     * Get question bank statistics
     */ async getStats() {
        const stats = await this.questionBankService.getStats();
        return {
            success: true,
            data: stats
        };
    }
    /**
     * Get unique role types for dropdown
     */ async getRoleTypes() {
        const roleTypes = await this.questionBankService.getRoleTypes();
        return {
            success: true,
            data: roleTypes
        };
    }
    /**
     * Get a single question by ID
     */ async getQuestion(id) {
        const question = await this.questionBankService.getQuestionById(id);
        return {
            success: true,
            data: question
        };
    }
    /**
     * Update a question
     */ async updateQuestion(id, dto) {
        const question = await this.questionBankService.updateQuestion(id, dto);
        return {
            success: true,
            message: 'Question updated successfully',
            data: question
        };
    }
    /**
     * Delete a question (soft delete)
     */ async deleteQuestion(id) {
        await this.questionBankService.deleteQuestion(id);
        return {
            success: true,
            message: 'Question deleted successfully'
        };
    }
    constructor(questionBankService){
        this.questionBankService = questionBankService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateQuestionDto === "undefined" ? Object : _dto.CreateQuestionDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "createQuestion", null);
_ts_decorate([
    (0, _common.Post)('bulk'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.BulkUploadDto === "undefined" ? Object : _dto.BulkUploadDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "bulkUpload", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.QuestionFiltersDto === "undefined" ? Object : _dto.QuestionFiltersDto
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getQuestions", null);
_ts_decorate([
    (0, _common.Get)('stats'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getStats", null);
_ts_decorate([
    (0, _common.Get)('role-types'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getRoleTypes", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getQuestion", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateQuestionDto === "undefined" ? Object : _dto.UpdateQuestionDto
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "updateQuestion", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], QuestionBankController.prototype, "deleteQuestion", null);
QuestionBankController = _ts_decorate([
    (0, _common.Controller)('admin/questions'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_constants.UserRole.ADMIN),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _questionbankservice.QuestionBankService === "undefined" ? Object : _questionbankservice.QuestionBankService
    ])
], QuestionBankController);

//# sourceMappingURL=question-bank.controller.js.map