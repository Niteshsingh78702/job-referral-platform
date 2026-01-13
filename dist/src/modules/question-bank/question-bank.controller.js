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
exports.QuestionBankController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const question_bank_service_1 = require("./question-bank.service");
const dto_1 = require("./dto");
let QuestionBankController = class QuestionBankController {
    questionBankService;
    constructor(questionBankService) {
        this.questionBankService = questionBankService;
    }
    async createQuestion(dto, user) {
        const question = await this.questionBankService.createQuestion(dto, user.id);
        return {
            success: true,
            message: 'Question created successfully',
            data: question,
        };
    }
    async bulkUpload(dto, user) {
        const result = await this.questionBankService.bulkUpload(dto.questions, user.id);
        return {
            success: true,
            message: `Uploaded ${result.success} questions, ${result.failed} failed`,
            data: result,
        };
    }
    async getQuestions(filters) {
        const result = await this.questionBankService.getQuestions(filters);
        return {
            success: true,
            data: result.questions,
            pagination: result.pagination,
        };
    }
    async getStats() {
        const stats = await this.questionBankService.getStats();
        return {
            success: true,
            data: stats,
        };
    }
    async getRoleTypes() {
        const roleTypes = await this.questionBankService.getRoleTypes();
        return {
            success: true,
            data: roleTypes,
        };
    }
    async getQuestion(id) {
        const question = await this.questionBankService.getQuestionById(id);
        return {
            success: true,
            data: question,
        };
    }
    async updateQuestion(id, dto) {
        const question = await this.questionBankService.updateQuestion(id, dto);
        return {
            success: true,
            message: 'Question updated successfully',
            data: question,
        };
    }
    async deleteQuestion(id) {
        await this.questionBankService.deleteQuestion(id);
        return {
            success: true,
            message: 'Question deleted successfully',
        };
    }
};
exports.QuestionBankController = QuestionBankController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BulkUploadDto, Object]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "bulkUpload", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuestionFiltersDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('role-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getRoleTypes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "getQuestion", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "deleteQuestion", null);
exports.QuestionBankController = QuestionBankController = __decorate([
    (0, common_1.Controller)('admin/questions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [question_bank_service_1.QuestionBankService])
], QuestionBankController);
//# sourceMappingURL=question-bank.controller.js.map