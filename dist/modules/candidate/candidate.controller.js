"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CandidateController", {
    enumerable: true,
    get: function() {
        return CandidateController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _candidateservice = require("./candidate.service");
const _dto = require("./dto");
const _decorators = require("../../common/decorators");
const _constants = require("../../common/constants");
const _cloudinaryservice = require("../cloudinary/cloudinary.service");
const _resumeparserservice = require("../resume-parser/resume-parser.service");
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
let CandidateController = class CandidateController {
    async getMe(userId) {
        return this.candidateService.getProfile(userId);
    }
    async getProfile(userId) {
        return this.candidateService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.candidateService.updateProfile(userId, dto);
    }
    async uploadResume(userId, file) {
        if (!file) {
            throw new _common.BadRequestException('Resume file is required');
        }
        // Upload to Cloudinary
        const { url, publicId } = await this.cloudinaryService.uploadResume(file, userId);
        // Parse resume to extract skills, experience, education
        const parsedData = await this.resumeParserService.parseResume(file);
        // Update candidate with resume URL and parsed data
        const candidate = await this.candidateService.updateResumeWithParsedData(userId, url, publicId, parsedData);
        return {
            resumeUrl: url,
            fileName: file.originalname,
            parsedData: {
                JobSkill: parsedData.JobSkill,
                experience: parsedData.experience,
                education: parsedData.education
            },
            candidate
        };
    }
    async addSkill(userId, dto) {
        return this.candidateService.addSkill(userId, dto);
    }
    async removeSkill(userId, skillId) {
        return this.candidateService.removeSkill(userId, skillId);
    }
    async addExperience(userId, dto) {
        return this.candidateService.addExperience(userId, dto);
    }
    async removeExperience(userId, experienceId) {
        return this.candidateService.removeExperience(userId, experienceId);
    }
    async addEducation(userId, dto) {
        return this.candidateService.addEducation(userId, dto);
    }
    async removeEducation(userId, educationId) {
        return this.candidateService.removeEducation(userId, educationId);
    }
    async getApplications(userId, status) {
        return this.candidateService.getApplications(userId, status);
    }
    async withdrawApplication(userId, applicationId) {
        return this.candidateService.withdrawApplication(userId, applicationId);
    }
    async getTestHistory(userId) {
        return this.candidateService.getTestHistory(userId);
    }
    async getPaymentHistory(userId) {
        return this.candidateService.getPaymentHistory(userId);
    }
    constructor(candidateService, cloudinaryService, resumeParserService){
        this.candidateService = candidateService;
        this.cloudinaryService = cloudinaryService;
        this.resumeParserService = resumeParserService;
    }
};
_ts_decorate([
    (0, _common.Get)('me'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "getMe", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Patch)('profile'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateCandidateProfileDto === "undefined" ? Object : _dto.UpdateCandidateProfileDto
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Post)('resume'),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('resume', {
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter: (req, file, cb)=>{
            const allowedMimes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new _common.BadRequestException('Only PDF and DOC/DOCX files are allowed'), false);
            }
        }
    })),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "uploadResume", null);
_ts_decorate([
    (0, _common.Post)('skills'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.AddSkillDto === "undefined" ? Object : _dto.AddSkillDto
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "addSkill", null);
_ts_decorate([
    (0, _common.Delete)('skills/:id'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "removeSkill", null);
_ts_decorate([
    (0, _common.Post)('experiences'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.AddExperienceDto === "undefined" ? Object : _dto.AddExperienceDto
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "addExperience", null);
_ts_decorate([
    (0, _common.Delete)('experiences/:id'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "removeExperience", null);
_ts_decorate([
    (0, _common.Post)('educations'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.AddEducationDto === "undefined" ? Object : _dto.AddEducationDto
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "addEducation", null);
_ts_decorate([
    (0, _common.Delete)('educations/:id'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "removeEducation", null);
_ts_decorate([
    (0, _common.Get)('applications'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "getApplications", null);
_ts_decorate([
    (0, _common.Patch)('applications/:id/withdraw'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "withdrawApplication", null);
_ts_decorate([
    (0, _common.Get)('tests'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "getTestHistory", null);
_ts_decorate([
    (0, _common.Get)('payments'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CandidateController.prototype, "getPaymentHistory", null);
CandidateController = _ts_decorate([
    (0, _common.Controller)('candidates'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _candidateservice.CandidateService === "undefined" ? Object : _candidateservice.CandidateService,
        typeof _cloudinaryservice.CloudinaryService === "undefined" ? Object : _cloudinaryservice.CloudinaryService,
        typeof _resumeparserservice.ResumeParserService === "undefined" ? Object : _resumeparserservice.ResumeParserService
    ])
], CandidateController);

//# sourceMappingURL=candidate.controller.js.map