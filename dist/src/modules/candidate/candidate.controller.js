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
exports.CandidateController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const candidate_service_1 = require("./candidate.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const resume_parser_service_1 = require("../resume-parser/resume-parser.service");
let CandidateController = class CandidateController {
    candidateService;
    cloudinaryService;
    resumeParserService;
    constructor(candidateService, cloudinaryService, resumeParserService) {
        this.candidateService = candidateService;
        this.cloudinaryService = cloudinaryService;
        this.resumeParserService = resumeParserService;
    }
    async getProfile(userId) {
        return this.candidateService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.candidateService.updateProfile(userId, dto);
    }
    async uploadResume(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('Resume file is required');
        }
        const { url, publicId } = await this.cloudinaryService.uploadResume(file, userId);
        const parsedData = await this.resumeParserService.parseResume(file);
        const candidate = await this.candidateService.updateResumeWithParsedData(userId, url, publicId, parsedData);
        return {
            resumeUrl: url,
            fileName: file.originalname,
            parsedData: {
                skills: parsedData.skills,
                experience: parsedData.experience,
                education: parsedData.education,
            },
            candidate,
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
    async getTestHistory(userId) {
        return this.candidateService.getTestHistory(userId);
    }
    async getPaymentHistory(userId) {
        return this.candidateService.getPaymentHistory(userId);
    }
};
exports.CandidateController = CandidateController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCandidateProfileDto]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('resume'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('resume', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF and DOC/DOCX files are allowed'), false);
            }
        }
    })),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "uploadResume", null);
__decorate([
    (0, common_1.Post)('skills'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddSkillDto]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "addSkill", null);
__decorate([
    (0, common_1.Delete)('skills/:id'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "removeSkill", null);
__decorate([
    (0, common_1.Post)('experiences'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddExperienceDto]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "addExperience", null);
__decorate([
    (0, common_1.Delete)('experiences/:id'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "removeExperience", null);
__decorate([
    (0, common_1.Post)('educations'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddEducationDto]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "addEducation", null);
__decorate([
    (0, common_1.Delete)('educations/:id'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "removeEducation", null);
__decorate([
    (0, common_1.Get)('applications'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Get)('tests'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "getTestHistory", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CandidateController.prototype, "getPaymentHistory", null);
exports.CandidateController = CandidateController = __decorate([
    (0, common_1.Controller)('candidates'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __metadata("design:paramtypes", [candidate_service_1.CandidateService,
        cloudinary_service_1.CloudinaryService,
        resume_parser_service_1.ResumeParserService])
], CandidateController);
//# sourceMappingURL=candidate.controller.js.map