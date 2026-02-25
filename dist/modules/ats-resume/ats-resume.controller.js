"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AtsResumeController", {
    enumerable: true,
    get: function() {
        return AtsResumeController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _atsresumeservice = require("./ats-resume.service");
const _updateatsresumedto = require("./dto/update-ats-resume.dto");
const _decorators = require("../../common/decorators");
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
let AtsResumeController = class AtsResumeController {
    /**
     * Upload a resume (PDF/DOCX) — parse, improve, and score (no auth, no storage)
     */ async uploadResume(file) {
        if (!file) {
            throw new _common.BadRequestException('Resume file is required');
        }
        return this.atsResumeService.uploadAndParse(file);
    }
    /**
     * Re-score resume from edited JSON data
     */ async scoreResume(dto) {
        return this.atsResumeService.scoreResume(this.dtoToJson(dto));
    }
    /**
     * Generate ATS-optimized PDF from provided data
     */ async generatePdf(dto, res) {
        const pdfBuffer = await this.atsResumeService.generatePdfFromData(this.dtoToJson(dto));
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="ats_resume.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    }
    // ── Map DTO → ParsedResumeJson ──
    dtoToJson(dto) {
        return {
            name: dto.name || '',
            email: dto.email || '',
            phone: dto.phone || '',
            location: dto.location || '',
            linkedin: dto.linkedin || '',
            summary: dto.summary || '',
            skills: dto.skills || [],
            experience: (dto.experience || []).map((e)=>({
                    company: e.company || '',
                    role: e.role || '',
                    startDate: e.startDate || '',
                    endDate: e.endDate,
                    project: e.project,
                    projectDescription: e.projectDescription,
                    bullets: e.bullets || []
                })),
            education: (dto.education || []).map((e)=>({
                    institution: e.institution || '',
                    degree: e.degree || '',
                    field: e.field,
                    year: e.year,
                    grade: e.grade
                })),
            certifications: (dto.certifications || []).map((c)=>({
                    name: c.name || '',
                    issuer: c.issuer,
                    year: c.year
                }))
        };
    }
    constructor(atsResumeService){
        this.atsResumeService = atsResumeService;
    }
};
_ts_decorate([
    (0, _common.Post)('upload'),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('resume', {
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    })),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
    ]),
    _ts_metadata("design:returntype", Promise)
], AtsResumeController.prototype, "uploadResume", null);
_ts_decorate([
    (0, _common.Post)('score'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _updateatsresumedto.UpdateAtsResumeDto === "undefined" ? Object : _updateatsresumedto.UpdateAtsResumeDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AtsResumeController.prototype, "scoreResume", null);
_ts_decorate([
    (0, _common.Post)('generate-pdf'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _updateatsresumedto.UpdateAtsResumeDto === "undefined" ? Object : _updateatsresumedto.UpdateAtsResumeDto,
        typeof Response === "undefined" ? Object : Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AtsResumeController.prototype, "generatePdf", null);
AtsResumeController = _ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Controller)('ats-resume'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _atsresumeservice.AtsResumeService === "undefined" ? Object : _atsresumeservice.AtsResumeService
    ])
], AtsResumeController);

//# sourceMappingURL=ats-resume.controller.js.map