"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const token_service_1 = require("../../auth/services/token.service");
const constants_1 = require("../../../common/constants");
const client_1 = require("@prisma/client");
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
let HRService = class HRService {
    prisma;
    tokenService;
    constructor(prisma, tokenService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
    }
    async register(dto, deviceInfo) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('Phone number already registered');
            }
        }
        const existingHR = await this.prisma.hR.findFirst({
            where: { companyEmail: dto.companyEmail },
        });
        if (existingHR) {
            throw new common_1.ConflictException('Company email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: constants_1.UserRole.HR,
                    status: constants_1.UserStatus.ACTIVE,
                    emailVerified: true,
                },
            });
            const hr = await tx.hR.create({
                data: {
                    userId: user.id,
                    companyName: dto.companyName,
                    companyEmail: dto.companyEmail,
                    companyWebsite: dto.companyWebsite,
                    designation: dto.designation,
                    linkedinUrl: dto.linkedinUrl,
                    approvalStatus: constants_1.HRApprovalStatus.APPROVED,
                    approvedAt: new Date(),
                },
            });
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.CREATE,
                    entityType: 'HR',
                    entityId: hr.id,
                    metadata: { registrationSource: 'hr_portal' },
                },
            });
            return { user, hr };
        });
        const payload = {
            sub: result.user.id,
            email: result.user.email,
            role: result.user.role,
        };
        const tokens = await this.tokenService.generateTokenPair(payload);
        return {
            ...tokens,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                hr: {
                    id: result.hr.id,
                    companyName: result.hr.companyName,
                    approvalStatus: result.hr.approvalStatus,
                },
            },
        };
    }
    async login(dto, deviceInfo) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { hr: true },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== constants_1.UserRole.HR) {
            throw new common_1.UnauthorizedException('This login is for HR accounts only');
        }
        if (user.status === constants_1.UserStatus.BLOCKED) {
            throw new common_1.UnauthorizedException('Account is blocked. Please contact support.');
        }
        if (!user.hr) {
            throw new common_1.BadRequestException('HR profile not found');
        }
        if (user.hr.approvalStatus === constants_1.HRApprovalStatus.PENDING) {
            throw new common_1.ForbiddenException('Your account is pending approval. Please wait for admin verification.');
        }
        if (user.hr.approvalStatus === constants_1.HRApprovalStatus.REJECTED) {
            throw new common_1.ForbiddenException(`Account rejected: ${user.hr.rejectionReason || 'Please contact support.'}`);
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.LOGIN,
                    entityType: 'HR',
                    entityId: user.hr.id,
                    metadata: { ip: deviceInfo?.ip, portal: 'hr' },
                },
            });
        });
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const tokens = await this.tokenService.generateTokenPair(payload);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                hr: {
                    id: user.hr.id,
                    companyName: user.hr.companyName,
                    designation: user.hr.designation,
                },
            },
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                hr: {
                    include: {
                        jobs: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                applicationCount: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const updated = await this.prisma.hR.update({
            where: { id: user.hr.id },
            data: {
                companyName: dto.companyName,
                companyWebsite: dto.companyWebsite,
                designation: dto.designation,
                linkedinUrl: dto.linkedinUrl,
            },
        });
        return updated;
    }
    async getDashboardStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const hrId = user.hr.id;
        const jobs = await this.prisma.job.findMany({
            where: { hrId },
            include: {
                applications: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(j => j.status === client_1.JobStatus.ACTIVE).length;
        const totalApplications = jobs.reduce((acc, j) => acc + j.applications.length, 0);
        const recentApplications = jobs.reduce((acc, j) => acc + j.applications.filter(a => a.createdAt >= thirtyDaysAgo).length, 0);
        const pendingReferrals = await this.prisma.referral.count({
            where: {
                hrId,
                status: 'PENDING',
            },
        });
        const confirmedReferrals = await this.prisma.referral.count({
            where: {
                hrId,
                status: 'CONFIRMED',
            },
        });
        return {
            totalJobs,
            activeJobs,
            totalApplications,
            recentApplications,
            pendingReferrals,
            confirmedReferrals,
            jobsByStatus: {
                draft: jobs.filter(j => j.status === client_1.JobStatus.DRAFT).length,
                active: activeJobs,
                closed: jobs.filter(j => j.status === client_1.JobStatus.CLOSED).length,
                expired: jobs.filter(j => j.status === client_1.JobStatus.EXPIRED).length,
            },
        };
    }
    async getRecentActivity(userId, limit = 10) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const recentApplications = await this.prisma.jobApplication.findMany({
            where: {
                job: { hrId: user.hr.id },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                candidate: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                job: {
                    select: {
                        title: true,
                        companyName: true,
                    },
                },
            },
        });
        return recentApplications.map(app => ({
            id: app.id,
            type: 'application',
            candidate: `${app.candidate.firstName} ${app.candidate.lastName}`,
            jobTitle: app.job.title,
            status: app.status,
            createdAt: app.createdAt,
        }));
    }
    async getJobs(userId, filters) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;
        const where = { hrId: user.hr.id };
        if (filters?.status) {
            where.status = filters.status;
        }
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { applications: true },
                    },
                    skills: true,
                },
            }),
            this.prisma.job.count({ where }),
        ]);
        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async createJob(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const baseSlug = dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `${baseSlug}-${randomSuffix}`;
        const job = await this.prisma.$transaction(async (tx) => {
            const newJob = await tx.job.create({
                data: {
                    slug,
                    title: dto.title,
                    description: dto.description,
                    requirements: dto.requirements,
                    responsibilities: dto.responsibilities,
                    companyName: user.hr.companyName,
                    location: dto.location,
                    isRemote: dto.isRemote ?? false,
                    salaryMin: dto.salaryMin,
                    salaryMax: dto.salaryMax,
                    experienceMin: dto.experienceMin,
                    experienceMax: dto.experienceMax,
                    educationLevel: dto.educationLevel,
                    maxApplications: dto.maxApplications ?? 100,
                    referralFee: dto.referralFee ?? 499,
                    status: client_1.JobStatus.DRAFT,
                    hrId: user.hr.id,
                },
            });
            if (dto.skills && dto.skills.length > 0) {
                await tx.jobSkill.createMany({
                    data: dto.skills.map(skill => ({
                        jobId: newJob.id,
                        name: skill,
                        isRequired: true,
                    })),
                });
            }
            await tx.hR.update({
                where: { id: user.hr.id },
                data: { totalJobsPosted: { increment: 1 } },
            });
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.CREATE,
                    entityType: 'Job',
                    entityId: newJob.id,
                },
            });
            return newJob;
        });
        return job;
    }
    async updateJobStatus(userId, jobId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.hrId !== user.hr.id) {
            throw new common_1.ForbiddenException('You can only modify your own jobs');
        }
        const newStatus = dto.status;
        const originalStatus = job.status;
        const updatedJob = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.job.update({
                where: { id: jobId },
                data: {
                    status: newStatus,
                    postedAt: newStatus === client_1.JobStatus.ACTIVE ? new Date() : undefined,
                },
            });
            if (newStatus === client_1.JobStatus.ACTIVE && originalStatus !== client_1.JobStatus.ACTIVE) {
                await tx.hR.update({
                    where: { id: user.hr.id },
                    data: { activeJobs: { increment: 1 } },
                });
            }
            else if (originalStatus === client_1.JobStatus.ACTIVE && newStatus !== client_1.JobStatus.ACTIVE) {
                await tx.hR.update({
                    where: { id: user.hr.id },
                    data: { activeJobs: { decrement: 1 } },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.UPDATE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: { status: job.status },
                    newValue: { status: dto.status },
                },
            });
            return updated;
        });
        return updatedJob;
    }
    async getJobById(userId, jobId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                skills: true,
                applications: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.hrId !== user.hr.id) {
            throw new common_1.ForbiddenException('You can only view your own jobs');
        }
        return job;
    }
    async updateJob(userId, jobId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const existingJob = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { skills: true },
        });
        if (!existingJob) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (existingJob.hrId !== user.hr.id) {
            throw new common_1.ForbiddenException('You can only modify your own jobs');
        }
        const updatedJob = await this.prisma.$transaction(async (tx) => {
            if (dto.skills && dto.skills.length > 0) {
                await tx.jobSkill.deleteMany({
                    where: { jobId },
                });
                await tx.jobSkill.createMany({
                    data: dto.skills.map(skill => ({
                        jobId,
                        name: skill,
                        isRequired: true,
                    })),
                });
            }
            const updated = await tx.job.update({
                where: { id: jobId },
                data: {
                    title: dto.title,
                    description: dto.description,
                    requirements: dto.requirements,
                    responsibilities: dto.responsibilities,
                    location: dto.location,
                    isRemote: dto.isRemote,
                    salaryMin: dto.salaryMin,
                    salaryMax: dto.salaryMax,
                    experienceMin: dto.experienceMin,
                    experienceMax: dto.experienceMax,
                    educationLevel: dto.educationLevel,
                    maxApplications: dto.maxApplications,
                    referralFee: dto.referralFee,
                    status: dto.status ? dto.status : undefined,
                },
                include: { skills: true },
            });
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.UPDATE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: { title: existingJob.title, status: existingJob.status },
                    newValue: { title: dto.title || existingJob.title, status: dto.status || existingJob.status },
                },
            });
            return updated;
        });
        return updatedJob;
    }
    async deleteJob(userId, jobId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.hrId !== user.hr.id) {
            throw new common_1.ForbiddenException('You can only delete your own jobs');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.jobSkill.deleteMany({ where: { jobId } });
            await tx.jobApplication.deleteMany({ where: { jobId } });
            await tx.job.delete({ where: { id: jobId } });
            await tx.hR.update({
                where: { id: user.hr.id },
                data: {
                    totalJobsPosted: { decrement: 1 },
                    activeJobs: job.status === client_1.JobStatus.ACTIVE ? { decrement: 1 } : undefined,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.DELETE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: { title: job.title, status: job.status },
                },
            });
        });
        return { message: 'Job deleted successfully' };
    }
    async getApplications(userId, filters) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hr: true },
        });
        if (!user || !user.hr) {
            throw new common_1.NotFoundException('HR profile not found');
        }
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            job: { hrId: user.hr.id },
        };
        if (filters?.jobId) {
            where.jobId = filters.jobId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    candidate: {
                        select: {
                            firstName: true,
                            lastName: true,
                            headline: true,
                            totalExperience: true,
                            currentCompany: true,
                            skills: {
                                select: {
                                    name: true,
                                    level: true,
                                },
                            },
                        },
                    },
                    job: {
                        select: {
                            id: true,
                            title: true,
                            companyName: true,
                        },
                    },
                },
            }),
            this.prisma.jobApplication.count({ where }),
        ]);
        return {
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.HRService = HRService;
exports.HRService = HRService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService])
], HRService);
//# sourceMappingURL=hr.service.js.map