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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CandidateService = class CandidateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            include: {
                skills: true,
                experiences: {
                    orderBy: { startDate: 'desc' },
                },
                educations: {
                    orderBy: { startYear: 'desc' },
                },
                user: {
                    select: {
                        email: true,
                        phone: true,
                        emailVerified: true,
                        phoneVerified: true,
                    },
                },
            },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return candidate;
    }
    async updateProfile(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.candidate.update({
            where: { userId },
            data: dto,
            include: {
                skills: true,
                experiences: true,
                educations: true,
            },
        });
    }
    async updateResume(userId, resumeUrl) {
        return this.prisma.candidate.update({
            where: { userId },
            data: { resumeUrl },
        });
    }
    async updateResumeWithParsedData(userId, resumeUrl, cloudinaryPublicId, parsedData) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const updatedCandidate = await this.prisma.candidate.update({
            where: { userId },
            data: {
                resumeUrl,
            },
        });
        for (const skillName of parsedData.skills.slice(0, 10)) {
            const existingSkill = await this.prisma.candidateSkill.findFirst({
                where: {
                    candidateId: candidate.id,
                    name: { equals: skillName, mode: 'insensitive' },
                },
            });
            if (!existingSkill) {
                await this.prisma.candidateSkill.create({
                    data: {
                        candidateId: candidate.id,
                        name: skillName,
                        level: 3,
                    },
                });
            }
        }
        return this.prisma.candidate.findUnique({
            where: { userId },
            include: {
                skills: true,
                experiences: true,
                educations: true,
            },
        });
    }
    async addSkill(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.candidateSkill.create({
            data: {
                candidateId: candidate.id,
                name: dto.name,
                level: dto.level || 1,
                yearsOfExp: dto.yearsOfExp,
            },
        });
    }
    async removeSkill(userId, skillId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.candidateSkill.delete({
            where: {
                id: skillId,
                candidateId: candidate.id,
            },
        });
    }
    async addExperience(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.experience.create({
            data: {
                candidateId: candidate.id,
                company: dto.company,
                role: dto.role,
                description: dto.description,
                location: dto.location,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isCurrent: dto.isCurrent || false,
            },
        });
    }
    async removeExperience(userId, experienceId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.experience.delete({
            where: {
                id: experienceId,
                candidateId: candidate.id,
            },
        });
    }
    async addEducation(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.education.create({
            data: {
                candidateId: candidate.id,
                institution: dto.institution,
                degree: dto.degree,
                field: dto.field,
                grade: dto.grade,
                startYear: dto.startYear,
                endYear: dto.endYear,
            },
        });
    }
    async removeEducation(userId, educationId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.education.delete({
            where: {
                id: educationId,
                candidateId: candidate.id,
            },
        });
    }
    async getApplications(userId, status) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        return this.prisma.jobApplication.findMany({
            where: {
                candidateId: candidate.id,
                ...(status && { status }),
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        location: true,
                        salaryMin: true,
                        salaryMax: true,
                        status: true,
                    },
                },
                referral: {
                    select: {
                        status: true,
                        type: true,
                    },
                },
                payments: {
                    select: {
                        status: true,
                        amount: true,
                        paidAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTestHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const applications = await this.prisma.jobApplication.findMany({
            where: { candidateId: candidate.id },
            select: { id: true },
        });
        const applicationIds = applications.map((a) => a.id);
        return this.prisma.testSession.findMany({
            where: {
                applicationId: { in: applicationIds },
            },
            include: {
                test: {
                    select: {
                        title: true,
                        duration: true,
                        passingScore: true,
                    },
                },
                application: {
                    include: {
                        job: {
                            select: {
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPaymentHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const applications = await this.prisma.jobApplication.findMany({
            where: { candidateId: candidate.id },
            select: { id: true },
        });
        const applicationIds = applications.map((a) => a.id);
        return this.prisma.payment.findMany({
            where: {
                applicationId: { in: applicationIds },
            },
            include: {
                application: {
                    include: {
                        job: {
                            select: {
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
                refund: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.CandidateService = CandidateService;
exports.CandidateService = CandidateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CandidateService);
//# sourceMappingURL=candidate.service.js.map