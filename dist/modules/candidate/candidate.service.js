"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CandidateService", {
    enumerable: true,
    get: function() {
        return CandidateService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../prisma/prisma.service");
const _uuid = require("uuid");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CandidateService = class CandidateService {
    // Get candidate profile
    async getProfile(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            },
            include: {
                CandidateSkill: true,
                Experience: {
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                Education: {
                    orderBy: {
                        startYear: 'desc'
                    }
                },
                User: {
                    select: {
                        email: true,
                        phone: true,
                        emailVerified: true,
                        phoneVerified: true
                    }
                }
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return candidate;
    }
    // Update profile
    async updateProfile(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        // Extract phone from DTO (phone is stored in User table)
        const { phone, linkedIn, ...candidateData } = dto;
        // Use transaction to update both User and Candidate
        const result = await this.prisma.$transaction(async (tx)=>{
            // Update phone in User table if provided
            if (phone !== undefined) {
                await tx.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        phone
                    }
                });
            }
            // Update candidate data (including linkedIn)
            const updatedCandidate = await tx.candidate.update({
                where: {
                    userId
                },
                data: {
                    ...candidateData,
                    linkedIn
                },
                include: {
                    CandidateSkill: true,
                    Experience: true,
                    Education: true,
                    User: {
                        select: {
                            email: true,
                            phone: true
                        }
                    }
                }
            });
            return updatedCandidate;
        });
        return result;
    }
    // Upload resume
    async updateResume(userId, resumeUrl) {
        return this.prisma.candidate.update({
            where: {
                userId
            },
            data: {
                resumeUrl
            }
        });
    }
    // Upload resume with parsed data from Cloudinary
    async updateResumeWithParsedData(userId, resumeUrl, cloudinaryPublicId, parsedData) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        // Update candidate with resume URL
        const updatedCandidate = await this.prisma.candidate.update({
            where: {
                userId
            },
            data: {
                resumeUrl
            }
        });
        // Auto-add parsed skills if they don't exist
        const skills = parsedData.JobSkill || [];
        for (const skillName of skills.slice(0, 10)){
            // Limit to 10 skills
            const existingSkill = await this.prisma.candidateSkill.findFirst({
                where: {
                    candidateId: candidate.id,
                    name: {
                        equals: skillName,
                        mode: 'insensitive'
                    }
                }
            });
            if (!existingSkill) {
                await this.prisma.candidateSkill.create({
                    data: {
                        id: (0, _uuid.v4)(),
                        candidateId: candidate.id,
                        name: skillName,
                        level: 3
                    }
                });
            }
        }
        return this.prisma.candidate.findUnique({
            where: {
                userId
            },
            include: {
                CandidateSkill: true,
                Experience: true,
                Education: true
            }
        });
    }
    // Add skill
    async addSkill(userId, dto) {
        console.log(`Adding skill for user ${userId}:`, dto);
        try {
            const candidate = await this.prisma.candidate.findUnique({
                where: {
                    userId
                }
            });
            if (!candidate) {
                console.error(`Candidate profile not found for user ${userId}`);
                throw new _common.NotFoundException('Candidate profile not found');
            }
            // Use upsert to handle duplicates gracefully
            return await this.prisma.candidateSkill.upsert({
                where: {
                    candidateId_name: {
                        candidateId: candidate.id,
                        name: dto.name
                    }
                },
                update: {
                    level: dto.level || 1,
                    yearsOfExp: dto.yearsOfExp
                },
                create: {
                    id: (0, _uuid.v4)(),
                    candidateId: candidate.id,
                    name: dto.name,
                    level: dto.level || 1,
                    yearsOfExp: dto.yearsOfExp
                }
            });
        } catch (error) {
            console.error('Error adding skill:', error);
            throw error;
        }
    }
    // Remove skill
    async removeSkill(userId, skillId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.candidateSkill.delete({
            where: {
                id: skillId,
                candidateId: candidate.id
            }
        });
    }
    // Add experience
    async addExperience(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.experience.create({
            data: {
                id: (0, _uuid.v4)(),
                candidateId: candidate.id,
                company: dto.company,
                role: dto.role,
                description: dto.description,
                location: dto.location,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isCurrent: dto.isCurrent || false
            }
        });
    }
    // Remove experience
    async removeExperience(userId, experienceId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.experience.delete({
            where: {
                id: experienceId,
                candidateId: candidate.id
            }
        });
    }
    // Add education
    async addEducation(userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.education.create({
            data: {
                id: (0, _uuid.v4)(),
                candidateId: candidate.id,
                institution: dto.institution,
                degree: dto.degree,
                field: dto.field,
                grade: dto.grade,
                startYear: dto.startYear,
                endYear: dto.endYear
            }
        });
    }
    // Remove education
    async removeEducation(userId, educationId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.education.delete({
            where: {
                id: educationId,
                candidateId: candidate.id
            }
        });
    }
    // Get applications
    async getApplications(userId, status) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        return this.prisma.jobApplication.findMany({
            where: {
                candidateId: candidate.id,
                ...status && {
                    status
                }
            },
            include: {
                Job: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        location: true,
                        salaryMin: true,
                        salaryMax: true,
                        status: true,
                        skillBucketId: true
                    }
                },
                Referral: {
                    select: {
                        status: true,
                        type: true
                    }
                },
                Payment: {
                    select: {
                        status: true,
                        amount: true,
                        paidAt: true
                    }
                },
                Interview: {
                    select: {
                        id: true,
                        status: true,
                        paymentStatus: true,
                        scheduledAt: true,
                        scheduledDate: true,
                        scheduledTime: true,
                        mode: true,
                        hrNotes: true,
                        interviewLink: true,
                        callDetails: true,
                        paidAt: true
                    }
                },
                TestSession: {
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        isPassed: true,
                        submittedAt: true
                    },
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // Withdraw/Cancel an application
    async withdrawApplication(userId, applicationId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        // Find the application and verify ownership
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            },
            include: {
                Job: {
                    select: {
                        title: true,
                        companyName: true
                    }
                },
                Interview: {
                    select: {
                        status: true,
                        paymentStatus: true
                    }
                },
                Payment: {
                    select: {
                        status: true
                    }
                }
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        if (application.candidateId !== candidate.id) {
            throw new _common.BadRequestException('You can only withdraw your own applications');
        }
        // Prevent withdrawal if already in advanced stages
        const nonWithdrawableStatuses = [
            'PAYMENT_SUCCESS',
            'INTERVIEW_COMPLETED',
            'SELECTED',
            'INTERVIEW_REJECTED',
            'WITHDRAWN'
        ];
        if (nonWithdrawableStatuses.includes(application.status)) {
            throw new _common.BadRequestException(`Cannot withdraw application with status: ${application.status}. This application has progressed too far.`);
        }
        // Check if payment has been made (Payment is an array)
        const payment = application.Payment?.[0];
        if (payment?.status === 'SUCCESS' || application.Interview?.paymentStatus === 'SUCCESS') {
            throw new _common.BadRequestException('Cannot withdraw after payment has been made. Please contact support for refund.');
        }
        // Update application status to WITHDRAWN
        const updatedApplication = await this.prisma.jobApplication.update({
            where: {
                id: applicationId
            },
            data: {
                status: 'WITHDRAWN',
                updatedAt: new Date()
            },
            include: {
                Job: {
                    select: {
                        title: true,
                        companyName: true
                    }
                }
            }
        });
        const jobTitle = updatedApplication.Job?.title;
        const companyName = updatedApplication.Job?.companyName;
        console.log(`Application withdrawn: ${applicationId} for job ${jobTitle} at ${companyName}`);
        return {
            message: `Application for ${jobTitle} at ${companyName} has been withdrawn.`,
            applicationId,
            jobId: application.jobId,
            withdrawnAt: new Date().toISOString()
        };
    }
    // Get test history
    async getTestHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        const applications = await this.prisma.jobApplication.findMany({
            where: {
                candidateId: candidate.id
            },
            select: {
                id: true
            }
        });
        const applicationIds = applications.map((a)=>a.id);
        return this.prisma.testSession.findMany({
            where: {
                applicationId: {
                    in: applicationIds
                }
            },
            include: {
                Test: {
                    select: {
                        title: true,
                        duration: true,
                        passingScore: true
                    }
                },
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                title: true,
                                companyName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // Get payment history
    async getPaymentHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate profile not found');
        }
        const applications = await this.prisma.jobApplication.findMany({
            where: {
                candidateId: candidate.id
            },
            select: {
                id: true
            }
        });
        const applicationIds = applications.map((a)=>a.id);
        return this.prisma.payment.findMany({
            where: {
                applicationId: {
                    in: applicationIds
                }
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                title: true,
                                companyName: true
                            }
                        }
                    }
                },
                Refund: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
CandidateService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], CandidateService);

//# sourceMappingURL=candidate.service.js.map