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
exports.SkillBucketController = void 0;
const common_1 = require("@nestjs/common");
const skill_bucket_service_1 = require("./skill-bucket.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
let SkillBucketController = class SkillBucketController {
    skillBucketService;
    constructor(skillBucketService) {
        this.skillBucketService = skillBucketService;
    }
    async getSkillBuckets(includeInactive) {
        const buckets = await this.skillBucketService.getSkillBuckets(includeInactive === 'true');
        return {
            success: true,
            data: buckets,
        };
    }
    async getSkillBucketById(id) {
        const bucket = await this.skillBucketService.getSkillBucketById(id);
        return {
            success: true,
            data: bucket,
        };
    }
    async createSkillBucket(dto) {
        const bucket = await this.skillBucketService.createSkillBucket(dto);
        return {
            success: true,
            message: 'Skill bucket created successfully',
            data: bucket,
        };
    }
    async updateSkillBucket(id, dto) {
        const bucket = await this.skillBucketService.updateSkillBucket(id, dto);
        return {
            success: true,
            message: 'Skill bucket updated successfully',
            data: bucket,
        };
    }
    async getSkillStatus(skillBucketId, candidateId) {
        if (!candidateId) {
            return {
                success: false,
                message: 'Candidate profile not found',
            };
        }
        const status = await this.skillBucketService.checkCandidateSkillStatus(candidateId, skillBucketId);
        return {
            success: true,
            data: status,
        };
    }
    async getValidPasses(candidateId) {
        if (!candidateId) {
            return {
                success: true,
                data: [],
            };
        }
        const passes = await this.skillBucketService.getCandidateValidPasses(candidateId);
        return {
            success: true,
            data: passes,
        };
    }
};
exports.SkillBucketController = SkillBucketController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillBuckets", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillBucketById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSkillBucketDto]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "createSkillBucket", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSkillBucketDto]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "updateSkillBucket", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillStatus", null);
__decorate([
    (0, common_1.Get)('candidate/valid-passes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getValidPasses", null);
exports.SkillBucketController = SkillBucketController = __decorate([
    (0, common_1.Controller)('skill-buckets'),
    __metadata("design:paramtypes", [skill_bucket_service_1.SkillBucketService])
], SkillBucketController);
//# sourceMappingURL=skill-bucket.controller.js.map