import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AtsResumeService, ParsedResumeJson } from './ats-resume.service';
import { UpdateAtsResumeDto } from './dto/update-ats-resume.dto';
import { Public } from '../../common/decorators';

@Public()
@Controller('ats-resume')
export class AtsResumeController {
    constructor(private readonly atsResumeService: AtsResumeService) { }

    /**
     * Upload a resume (PDF/DOCX) — parse, improve, and score (no auth, no storage)
     */
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('resume', {
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async uploadResume(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Resume file is required');
        }
        return this.atsResumeService.uploadAndParse(file);
    }

    /**
     * Re-score resume from edited JSON data
     */
    @Post('score')
    async scoreResume(@Body() dto: UpdateAtsResumeDto) {
        return this.atsResumeService.scoreResume(this.dtoToJson(dto));
    }

    /**
     * Generate ATS-optimized PDF from provided data
     */
    @Post('generate-pdf')
    async generatePdf(@Body() dto: UpdateAtsResumeDto, @Res() res: Response) {
        const pdfBuffer = await this.atsResumeService.generatePdfFromData(this.dtoToJson(dto));
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="ats_resume.pdf"',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    }

    // ── Map DTO → ParsedResumeJson ──
    private dtoToJson(dto: UpdateAtsResumeDto): ParsedResumeJson {
        return {
            name: dto.name || '',
            email: dto.email || '',
            phone: dto.phone || '',
            location: dto.location || '',
            linkedin: dto.linkedin || '',
            summary: dto.summary || '',
            skills: dto.skills || [],
            experience: (dto.experience || []).map((e) => ({
                company: e.company || '',
                role: e.role || '',
                startDate: e.startDate || '',
                endDate: e.endDate,
                project: e.project,
                projectDescription: e.projectDescription,
                bullets: e.bullets || [],
            })),
            education: (dto.education || []).map((e) => ({
                institution: e.institution || '',
                degree: e.degree || '',
                field: e.field,
                year: e.year,
                grade: e.grade,
            })),
            certifications: (dto.certifications || []).map((c) => ({
                name: c.name || '',
                issuer: c.issuer,
                year: c.year,
            })),
        };
    }
}
