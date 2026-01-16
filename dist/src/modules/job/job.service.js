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
exports.JobService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
const skill_bucket_service_1 = require("../skill-bucket/skill-bucket.service");
let JobService = class JobService {
    prisma;
    skillBucketService;
    constructor(prisma, skillBucketService) {
        this.prisma = prisma;
        this.skillBucketService = skillBucketService;
    }
    async createJob(hrId, dto) {
        const hr = await this.prisma.hR.findUnique({
            where: { userId: hrId },
        });
        if (!hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        if (hr.approvalStatus !== 'APPROVED') {
            throw new common_1.ForbiddenException('HR account not yet approved');
        }
        const slug = this.generateSlug(dto.title, dto.companyName);
        const job = await this.prisma.$transaction(async (tx) => {
            const newJob = await tx.job.create({
                data: {
                    slug,
                    title: dto.title,
                    description: dto.description,
                    requirements: dto.requirements,
                    responsibilities: dto.responsibilities,
                    companyName: dto.companyName,
                    companyLogo: dto.companyLogo,
                    location: dto.location,
                    isRemote: dto.isRemote || false,
                    salaryMin: dto.salaryMin,
                    salaryMax: dto.salaryMax,
                    salaryCurrency: dto.salaryCurrency || 'INR',
                    experienceMin: dto.experienceMin,
                    experienceMax: dto.experienceMax,
                    educationLevel: dto.educationLevel,
                    maxApplications: dto.maxApplications || 100,
                    referralFee: dto.referralFee || 499,
                    testId: dto.testId,
                    hrId: hr.id,
                    status: constants_1.JobStatus.PENDING_APPROVAL,
                },
            });
            if (dto.skills && dto.skills.length > 0) {
                await tx.jobSkill.createMany({
                    data: dto.skills.map((skill) => ({
                        jobId: newJob.id,
                        name: skill.name,
                        isRequired: skill.isRequired ?? true,
                    })),
                });
            }
            await tx.hR.update({
                where: { id: hr.id },
                data: { totalJobsPosted: { increment: 1 } },
            });
            return newJob;
        });
        return this.getJobById(job.id);
    }
    async getActiveJobs(query) {
        const { search, location, company, experienceMin, experienceMax, isRemote, page, limit } = query;
        const where = {
            status: constants_1.JobStatus.ACTIVE,
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        if (company) {
            where.companyName = { contains: company, mode: 'insensitive' };
        }
        if (typeof isRemote === 'boolean') {
            where.isRemote = isRemote;
        }
        if (experienceMin !== undefined) {
            where.experienceMin = { gte: experienceMin };
        }
        if (experienceMax !== undefined) {
            where.experienceMax = { lte: experienceMax };
        }
        const skip = ((page || 1) - 1) * (limit || 10);
        const take = limit || 10;
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take,
                include: {
                    skills: true,
                    hr: {
                        select: {
                            companyName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.job.count({ where }),
        ]);
        return {
            data: jobs,
            meta: {
                page: page || 1,
                limit: limit || 10,
                total,
                totalPages: Math.ceil(total / (limit || 10)),
            },
        };
    }
    async getJobById(idOrSlug) {
        const job = await this.prisma.job.findFirst({
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }],
            },
            include: {
                skills: true,
                test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true,
                    },
                },
                hr: {
                    select: {
                        companyName: true,
                        companyWebsite: true,
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return job;
    }
    async updateJob(jobId, hrId, dto) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { hr: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.hr && job.hr.userId !== hrId) {
            throw new common_1.ForbiddenException('Not authorized to update this job');
        }
        if (!job.hr) {
            throw new common_1.ForbiddenException('Only admin can update admin-created jobs');
        }
        return this.prisma.job.update({
            where: { id: jobId },
            data: dto,
            include: { skills: true },
        });
    }
    async applyForJob(jobId, userId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                skillBucket: {
                    include: {
                        test: true,
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.status !== constants_1.JobStatus.ACTIVE) {
            throw new common_1.BadRequestException('Job is not accepting applications');
        }
        if (job.applicationCount >= job.maxApplications) {
            throw new common_1.BadRequestException('Job has reached maximum applications');
        }
        const existingApplication = await this.prisma.jobApplication.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId: candidate.id,
                    jobId: job.id,
                },
            },
        });
        if (existingApplication) {
            throw new common_1.BadRequestException('Already applied for this job');
        }
        let applicationStatus = constants_1.ApplicationStatus.APPLIED;
        let skillCheckResult = null;
        skillCheckResult = await this.skillBucketService.checkAllRequiredSkillsForJob(candidate.id, job.id);
        if (skillCheckResult.hasRequirements) {
            if (skillCheckResult.canApply) {
                applicationStatus = constants_1.ApplicationStatus.APPLIED;
            }
            else {
                const missingSkillNames = skillCheckResult.missingTests
                    .map(t => t.displayName || t.skillBucketName)
                    .join(', ');
                const inCooldown = skillCheckResult.missingTests.filter(t => t.isFailed && !t.canRetest);
                if (inCooldown.length > 0) {
                    const cooldownInfo = inCooldown
                        .map(t => `${t.skillBucketName} (${t.retestInHours}h remaining)`)
                        .join(', ');
                    throw new common_1.BadRequestException(`You are in cooldown for: ${cooldownInfo}. Please wait before retrying.`);
                }
                const expired = skillCheckResult.missingTests.filter(t => t.isPassed && !t.isValid);
                if (expired.length > 0) {
                    throw new common_1.BadRequestException(`Your verification has expired for: ${missingSkillNames}. Please retake the HR Shortlisting Check.`);
                }
                throw new common_1.BadRequestException(`You need to pass the following skill tests before applying: ${missingSkillNames}`);
            }
        }
        else if (job.testId) {
            applicationStatus = constants_1.ApplicationStatus.TEST_REQUIRED;
        }
        const application = await this.prisma.$transaction(async (tx) => {
            const firstPassedTest = skillCheckResult?.passedTests[0];
            const app = await tx.jobApplication.create({
                data: {
                    candidateId: candidate.id,
                    jobId: job.id,
                    status: applicationStatus,
                    coverLetter: dto.coverLetter,
                    ...(firstPassedTest && {
                        testScore: firstPassedTest.score,
                        testPassedAt: new Date(),
                    }),
                },
            });
            await tx.job.update({
                where: { id: job.id },
                data: { applicationCount: { increment: 1 } },
            });
            return app;
        });
        return {
            ...application,
            skillTestInfo: skillCheckResult?.hasRequirements ? {
                passedSkills: skillCheckResult.passedTests.map(t => ({
                    skillBucketName: t.skillBucketName,
                    displayName: t.displayName,
                    score: t.score,
                    validTill: t.validTill,
                    validDaysRemaining: t.validDaysRemaining,
                })),
                canApply: skillCheckResult.canApply,
            } : null,
        };
    }
    async getHRJobs(hrId, status) {
        const hr = await this.prisma.hR.findUnique({
            where: { userId: hrId },
        });
        if (!hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        return this.prisma.job.findMany({
            where: {
                hrId: hr.id,
                ...(status && { status }),
            },
            include: {
                skills: true,
                _count: {
                    select: { applications: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    generateSlug(title, company) {
        const base = `${title}-at-${company}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const timestamp = Date.now().toString(36);
        return `${base}-${timestamp}`;
    }
};
exports.JobService = JobService;
exports.JobService = JobService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        skill_bucket_service_1.SkillBucketService])
], JobService);
//# sourceMappingURL=job.service.js.map