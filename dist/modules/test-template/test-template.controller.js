"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TestTemplateController", {
    enumerable: true,
    get: function() {
        return TestTemplateController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../../common/guards/jwt-auth.guard");
const _rolesguard = require("../../common/guards/roles.guard");
const _rolesdecorator = require("../../common/decorators/roles.decorator");
const _constants = require("../../common/constants");
const _testtemplateservice = require("./test-template.service");
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
let TestTemplateController = class TestTemplateController {
    /**
   * Create a new test template
   */ async createTemplate(dto) {
        const template = await this.testTemplateService.createTemplate(dto);
        return {
            success: true,
            message: 'Test template created successfully',
            data: template
        };
    }
    /**
   * Get templates with filters and pagination
   */ async getTemplates(filters) {
        const result = await this.testTemplateService.getTemplates(filters);
        return {
            success: true,
            data: result.templates,
            pagination: result.pagination
        };
    }
    /**
   * Get a single template by ID
   */ async getTemplate(id) {
        const template = await this.testTemplateService.getTemplateById(id);
        return {
            success: true,
            data: template
        };
    }
    /**
   * Preview questions for a template
   */ async previewQuestions(id, count) {
        const questions = await this.testTemplateService.previewQuestions(id, count || 10);
        return {
            success: true,
            data: questions
        };
    }
    /**
   * Update a template
   */ async updateTemplate(id, dto) {
        const template = await this.testTemplateService.updateTemplate(id, dto);
        return {
            success: true,
            message: 'Test template updated successfully',
            data: template
        };
    }
    /**
   * Assign template to skill bucket
   */ async assignToSkillBucket(id, dto) {
        const result = await this.testTemplateService.assignToSkillBucket(id, dto);
        return result;
    }
    /**
   * Unassign template from skill bucket
   */ async unassignFromSkillBucket(skillBucketId) {
        const result = await this.testTemplateService.unassignFromSkillBucket(skillBucketId);
        return result;
    }
    /**
   * Delete a template (soft delete)
   */ async deleteTemplate(id) {
        await this.testTemplateService.deleteTemplate(id);
        return {
            success: true,
            message: 'Test template deleted successfully'
        };
    }
    constructor(testTemplateService){
        this.testTemplateService = testTemplateService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateTestTemplateDto === "undefined" ? Object : _dto.CreateTestTemplateDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "createTemplate", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.TemplateFiltersDto === "undefined" ? Object : _dto.TemplateFiltersDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "getTemplates", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "getTemplate", null);
_ts_decorate([
    (0, _common.Get)(':id/preview'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Query)('count')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "previewQuestions", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateTestTemplateDto === "undefined" ? Object : _dto.UpdateTestTemplateDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "updateTemplate", null);
_ts_decorate([
    (0, _common.Post)(':id/assign'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.AssignTemplateDto === "undefined" ? Object : _dto.AssignTemplateDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "assignToSkillBucket", null);
_ts_decorate([
    (0, _common.Delete)('skill-bucket/:skillBucketId'),
    _ts_param(0, (0, _common.Param)('skillBucketId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "unassignFromSkillBucket", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TestTemplateController.prototype, "deleteTemplate", null);
TestTemplateController = _ts_decorate([
    (0, _common.Controller)('admin/test-templates'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_constants.UserRole.ADMIN),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _testtemplateservice.TestTemplateService === "undefined" ? Object : _testtemplateservice.TestTemplateService
    ])
], TestTemplateController);

//# sourceMappingURL=test-template.controller.js.map