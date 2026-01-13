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
exports.TestTemplateController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const test_template_service_1 = require("./test-template.service");
const dto_1 = require("./dto");
let TestTemplateController = class TestTemplateController {
    testTemplateService;
    constructor(testTemplateService) {
        this.testTemplateService = testTemplateService;
    }
    async createTemplate(dto) {
        const template = await this.testTemplateService.createTemplate(dto);
        return {
            success: true,
            message: 'Test template created successfully',
            data: template,
        };
    }
    async getTemplates(filters) {
        const result = await this.testTemplateService.getTemplates(filters);
        return {
            success: true,
            data: result.templates,
            pagination: result.pagination,
        };
    }
    async getTemplate(id) {
        const template = await this.testTemplateService.getTemplateById(id);
        return {
            success: true,
            data: template,
        };
    }
    async previewQuestions(id, count) {
        const questions = await this.testTemplateService.previewQuestions(id, count || 10);
        return {
            success: true,
            data: questions,
        };
    }
    async updateTemplate(id, dto) {
        const template = await this.testTemplateService.updateTemplate(id, dto);
        return {
            success: true,
            message: 'Test template updated successfully',
            data: template,
        };
    }
    async assignToSkillBucket(id, dto) {
        const result = await this.testTemplateService.assignToSkillBucket(id, dto);
        return result;
    }
    async unassignFromSkillBucket(skillBucketId) {
        const result = await this.testTemplateService.unassignFromSkillBucket(skillBucketId);
        return result;
    }
    async deleteTemplate(id) {
        await this.testTemplateService.deleteTemplate(id);
        return {
            success: true,
            message: 'Test template deleted successfully',
        };
    }
};
exports.TestTemplateController = TestTemplateController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTestTemplateDto]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TemplateFiltersDto]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Get)(':id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "previewQuestions", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTestTemplateDto]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AssignTemplateDto]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "assignToSkillBucket", null);
__decorate([
    (0, common_1.Delete)('skill-bucket/:skillBucketId'),
    __param(0, (0, common_1.Param)('skillBucketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "unassignFromSkillBucket", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTemplateController.prototype, "deleteTemplate", null);
exports.TestTemplateController = TestTemplateController = __decorate([
    (0, common_1.Controller)('admin/test-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [test_template_service_1.TestTemplateService])
], TestTemplateController);
//# sourceMappingURL=test-template.controller.js.map