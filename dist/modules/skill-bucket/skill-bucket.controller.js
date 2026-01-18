"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SkillBucketController", {
    enumerable: true,
    get: function() {
        return SkillBucketController;
    }
});
const _common = require("@nestjs/common");
const _skillbucketservice = require("./skill-bucket.service");
const _dto = require("./dto");
const _jwtauthguard = require("../../common/guards/jwt-auth.guard");
const _rolesguard = require("../../common/guards/roles.guard");
const _rolesdecorator = require("../../common/decorators/roles.decorator");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
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
let SkillBucketController = class SkillBucketController {
    // ==========================================
    // PUBLIC: List skill buckets
    // ==========================================
    async getSkillBuckets(includeInactive) {
        const buckets = await this.skillBucketService.getSkillBuckets(includeInactive === 'true');
        return {
            success: true,
            data: buckets
        };
    }
    async getSkillBucketById(id) {
        const bucket = await this.skillBucketService.getSkillBucketById(id);
        return {
            success: true,
            data: bucket
        };
    }
    // ==========================================
    // ADMIN: Skill bucket management
    // ==========================================
    async createSkillBucket(dto) {
        const bucket = await this.skillBucketService.createSkillBucket(dto);
        return {
            success: true,
            message: 'Skill bucket created successfully',
            data: bucket
        };
    }
    async updateSkillBucket(id, dto) {
        const bucket = await this.skillBucketService.updateSkillBucket(id, dto);
        return {
            success: true,
            message: 'Skill bucket updated successfully',
            data: bucket
        };
    }
    // ==========================================
    // CANDIDATE: Skill test status
    // ==========================================
    async getSkillStatus(skillBucketId, candidateId) {
        if (!candidateId) {
            return {
                success: false,
                message: 'Candidate profile not found'
            };
        }
        const status = await this.skillBucketService.checkCandidateSkillStatus(candidateId, skillBucketId);
        return {
            success: true,
            data: status
        };
    }
    async getValidPasses(candidateId) {
        if (!candidateId) {
            return {
                success: true,
                data: []
            };
        }
        const passes = await this.skillBucketService.getCandidateValidPasses(candidateId);
        return {
            success: true,
            data: passes
        };
    }
    constructor(skillBucketService){
        this.skillBucketService = skillBucketService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Query)('includeInactive')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillBuckets", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillBucketById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.CreateSkillBucketDto === "undefined" ? Object : _dto.CreateSkillBucketDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "createSkillBucket", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateSkillBucketDto === "undefined" ? Object : _dto.UpdateSkillBucketDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "updateSkillBucket", null);
_ts_decorate([
    (0, _common.Get)(':id/status'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)('candidateId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getSkillStatus", null);
_ts_decorate([
    (0, _common.Get)('candidate/valid-passes'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('candidateId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], SkillBucketController.prototype, "getValidPasses", null);
SkillBucketController = _ts_decorate([
    (0, _common.Controller)('skill-buckets'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _skillbucketservice.SkillBucketService === "undefined" ? Object : _skillbucketservice.SkillBucketService
    ])
], SkillBucketController);

//# sourceMappingURL=skill-bucket.controller.js.map