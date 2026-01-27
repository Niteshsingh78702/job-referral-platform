"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HRService", {
    enumerable: true,
    get: function() {
        return HRService;
    }
});
const _common = require("@nestjs/common");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../../prisma/prisma.service");
const _tokenservice = require("../../auth/services/token.service");
const _constants = require("../../../common/constants");
const _client = require("@prisma/client");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
let HRService = class HRService {
    /**
   * Register a new HR account
   * - Validates corporate email domain
   * - Creates user with HR role
   * - Creates HR profile with pending approval status (auto-approved for dev)
   */ async register(dto, deviceInfo) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (existingUser) {
            throw new _common.ConflictException('Email already registered');
        }
        // Check phone if provided
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: {
                    phone: dto.phone
                }
            });
            if (existingPhone) {
                throw new _common.ConflictException('Phone number already registered');
            }
        }
        // Check company email already registered as HR
        const existingHR = await this.prisma.hR.findFirst({
            where: {
                companyEmail: dto.companyEmail
            }
        });
        if (existingHR) {
            throw new _common.ConflictException('Company email already registered');
        }
        // Hash password
        const passwordHash = await _bcrypt.hash(dto.password, 12);
        // Create user and HR profile in transaction
        const result = await this.prisma.$transaction(async (tx)=>{
            // Create user with HR role
            const user = await tx.user.create({
                data: {
                    id: _crypto.randomUUID(),
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: _constants.UserRole.HR,
                    status: _constants.UserStatus.ACTIVE,
                    emailVerified: true,
                    updatedAt: new Date()
                }
            });
            // Create HR profile - Auto-approved for development
            const hr = await tx.hR.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    companyName: dto.companyName,
                    companyEmail: dto.companyEmail,
                    companyWebsite: dto.companyWebsite,
                    designation: dto.designation,
                    linkedinUrl: dto.linkedinUrl,
                    approvalStatus: _constants.HRApprovalStatus.APPROVED,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent
                    }
                });
            }
            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.CREATE,
                    entityType: 'HR',
                    entityId: hr.id,
                    metadata: {
                        registrationSource: 'hr_portal'
                    }
                }
            });
            return {
                user,
                hr
            };
        });
        // Generate tokens
        const payload = {
            sub: result.user.id,
            email: result.user.email,
            role: result.user.role
        };
        const tokens = await this.tokenService.generateTokenPair(payload);
        return {
            ...tokens,
            User: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                HR: {
                    id: result.hr.id,
                    companyName: result.hr.companyName,
                    approvalStatus: result.hr.approvalStatus
                }
            }
        };
    }
    /**
   * Login for HR users
   * - Implements rate limiting (5 attempts per 15 min)
   * - Checks HR approval status
   */ async login(dto, deviceInfo) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.passwordHash) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== _constants.UserRole.HR) {
            throw new _common.UnauthorizedException('This login is for HR accounts only');
        }
        if (user.status === _constants.UserStatus.BLOCKED) {
            throw new _common.UnauthorizedException('Account is blocked. Please contact support.');
        }
        // Check HR approval status
        if (!user.HR) {
            throw new _common.BadRequestException('HR profile not found');
        }
        if (user.HR.approvalStatus === _constants.HRApprovalStatus.PENDING) {
            throw new _common.ForbiddenException('Your account is pending approval. Please wait for admin verification.');
        }
        if (user.HR.approvalStatus === _constants.HRApprovalStatus.REJECTED) {
            throw new _common.ForbiddenException(`Account rejected: ${user.HR.rejectionReason || 'Please contact support.'}`);
        }
        // Verify password
        const isValid = await _bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        // Update last login
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLoginAt: new Date()
                }
            });
            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.LOGIN,
                    entityType: 'HR',
                    entityId: user.HR.id,
                    metadata: {
                        ip: deviceInfo?.ip,
                        portal: 'hr'
                    }
                }
            });
        });
        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const tokens = await this.tokenService.generateTokenPair(payload);
        return {
            ...tokens,
            User: {
                id: user.id,
                email: user.email,
                role: user.role,
                HR: {
                    id: user.HR.id,
                    companyName: user.HR.companyName,
                    designation: user.HR.designation
                }
            }
        };
    }
    /**
   * Get HR profile with stats
   */ async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: {
                    include: {
                        Job: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                applicationCount: true
                            }
                        }
                    }
                }
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    /**
   * Update HR profile
   */ async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const updated = await this.prisma.hR.update({
            where: {
                id: user.HR.id
            },
            data: {
                companyName: dto.companyName,
                companyWebsite: dto.companyWebsite,
                designation: dto.designation,
                linkedinUrl: dto.linkedinUrl
            }
        });
        return updated;
    }
    /**
   * Get dashboard statistics
   */ async getDashboardStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const hrId = user.HR.id;
        // Get job stats
        const jobs = await this.prisma.job.findMany({
            where: {
                hrId
            },
            include: {
                JobApplication: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter((j)=>j.status === _client.JobStatus.ACTIVE).length;
        const totalApplications = jobs.reduce((acc, j)=>acc + j.JobApplication.length, 0);
        const recentApplications = jobs.reduce((acc, j)=>acc + j.JobApplication.filter((a)=>a.createdAt >= thirtyDaysAgo).length, 0);
        const pendingReferrals = await this.prisma.referral.count({
            where: {
                hrId,
                status: 'PENDING'
            }
        });
        const confirmedReferrals = await this.prisma.referral.count({
            where: {
                hrId,
                status: 'CONFIRMED'
            }
        });
        return {
            totalJobs,
            activeJobs,
            totalApplications,
            recentApplications,
            pendingReferrals,
            confirmedReferrals,
            jobsByStatus: {
                draft: jobs.filter((j)=>j.status === _client.JobStatus.DRAFT).length,
                active: activeJobs,
                closed: jobs.filter((j)=>j.status === _client.JobStatus.CLOSED).length,
                expired: jobs.filter((j)=>j.status === _client.JobStatus.EXPIRED).length
            }
        };
    }
    /**
   * Get recent activity for dashboard
   */ async getRecentActivity(userId, limit = 10) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        // Get recent applications on HR's jobs
        const recentApplications = await this.prisma.jobApplication.findMany({
            where: {
                Job: {
                    hrId: user.HR.id
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            include: {
                Candidate: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                Job: {
                    select: {
                        title: true,
                        companyName: true
                    }
                }
            }
        });
        return recentApplications.map((app)=>({
                id: app.id,
                type: 'application',
                Candidate: `${app.Candidate.firstName} ${app.Candidate.lastName}`,
                jobTitle: app.Job.title,
                status: app.status,
                createdAt: app.createdAt
            }));
    }
    /**
   * Get HR's jobs
   */ async getJobs(userId, filters) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
            hrId: user.HR.id
        };
        if (filters?.status) {
            where.status = filters.status;
        }
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: {
                            JobApplication: true
                        }
                    },
                    JobSkill: true
                }
            }),
            this.prisma.job.count({
                where
            })
        ]);
        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
   * Create a new job posting
   */ async createJob(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        // Generate slug from title
        const baseSlug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `${baseSlug}-${randomSuffix}`;
        const job = await this.prisma.$transaction(async (tx)=>{
            const newJob = await tx.job.create({
                data: {
                    id: _crypto.randomUUID(),
                    slug,
                    title: dto.title,
                    description: dto.description,
                    requirements: dto.requirements,
                    responsibilities: dto.responsibilities,
                    companyName: user.HR.companyName,
                    location: dto.location,
                    isRemote: dto.isRemote ?? false,
                    salaryMin: dto.salaryMin,
                    salaryMax: dto.salaryMax,
                    experienceMin: dto.experienceMin,
                    experienceMax: dto.experienceMax,
                    educationLevel: dto.educationLevel,
                    maxApplications: dto.maxApplications ?? 100,
                    referralFee: dto.referralFee ?? 499,
                    status: _client.JobStatus.DRAFT,
                    hrId: user.HR.id,
                    updatedAt: new Date()
                }
            });
            // Add skills
            if (dto.jobSkill && dto.jobSkill.length > 0) {
                await tx.jobSkill.createMany({
                    data: dto.jobSkill.map((skill)=>({
                            id: _crypto.randomUUID(),
                            jobId: newJob.id,
                            name: skill,
                            isRequired: true
                        }))
                });
            }
            // Update HR stats
            await tx.hR.update({
                where: {
                    id: user.HR.id
                },
                data: {
                    totalJobsPosted: {
                        increment: 1
                    }
                }
            });
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.CREATE,
                    entityType: 'Job',
                    entityId: newJob.id
                }
            });
            return newJob;
        });
        return job;
    }
    /**
   * Update job status (publish, close, etc.)
   */ async updateJobStatus(userId, jobId, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        if (job.hrId !== user.HR.id) {
            throw new _common.ForbiddenException('You can only modify your own jobs');
        }
        const newStatus = dto.status;
        const originalStatus = job.status;
        const updatedJob = await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.job.update({
                where: {
                    id: jobId
                },
                data: {
                    status: newStatus,
                    postedAt: newStatus === _client.JobStatus.ACTIVE ? new Date() : undefined
                }
            });
            // Update active jobs count
            if (newStatus === _client.JobStatus.ACTIVE && originalStatus !== _client.JobStatus.ACTIVE) {
                await tx.hR.update({
                    where: {
                        id: user.HR.id
                    },
                    data: {
                        activeJobs: {
                            increment: 1
                        }
                    }
                });
            } else if (originalStatus === _client.JobStatus.ACTIVE && newStatus !== _client.JobStatus.ACTIVE) {
                await tx.hR.update({
                    where: {
                        id: user.HR.id
                    },
                    data: {
                        activeJobs: {
                            decrement: 1
                        }
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.UPDATE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: {
                        status: job.status
                    },
                    newValue: {
                        status: dto.status
                    }
                }
            });
            return updated;
        });
        return updatedJob;
    }
    /**
   * Get a single job by ID
   */ async getJobById(userId, jobId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                JobSkill: true,
                JobApplication: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        if (job.hrId !== user.HR.id) {
            throw new _common.ForbiddenException('You can only view your own jobs');
        }
        return job;
    }
    /**
   * Update a job (full edit)
   */ async updateJob(userId, jobId, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const existingJob = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                JobSkill: true
            }
        });
        if (!existingJob) {
            throw new _common.NotFoundException('Job not found');
        }
        if (existingJob.hrId !== user.HR.id) {
            throw new _common.ForbiddenException('You can only modify your own jobs');
        }
        const updatedJob = await this.prisma.$transaction(async (tx)=>{
            // Update skills if provided
            if (dto.jobSkill && dto.jobSkill.length > 0) {
                // Delete existing skills
                await tx.jobSkill.deleteMany({
                    where: {
                        jobId
                    }
                });
                // Add new skills
                await tx.jobSkill.createMany({
                    data: dto.jobSkill.map((skill)=>({
                            id: _crypto.randomUUID(),
                            jobId,
                            name: skill,
                            isRequired: true
                        }))
                });
            }
            // Update job data
            const updated = await tx.job.update({
                where: {
                    id: jobId
                },
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
                    status: dto.status ? dto.status : undefined
                },
                include: {
                    JobSkill: true
                }
            });
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.UPDATE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: {
                        title: existingJob.title,
                        status: existingJob.status
                    },
                    newValue: {
                        title: dto.title || existingJob.title,
                        status: dto.status || existingJob.status
                    }
                }
            });
            return updated;
        });
        return updatedJob;
    }
    /**
   * Delete a job
   */ async deleteJob(userId, jobId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            }
        });
        if (!job) {
            throw new _common.NotFoundException('Job not found');
        }
        if (job.hrId !== user.HR.id) {
            throw new _common.ForbiddenException('You can only delete your own jobs');
        }
        await this.prisma.$transaction(async (tx)=>{
            // Delete related records first
            await tx.jobSkill.deleteMany({
                where: {
                    jobId
                }
            });
            await tx.jobApplication.deleteMany({
                where: {
                    jobId
                }
            });
            // Delete the job
            await tx.job.delete({
                where: {
                    id: jobId
                }
            });
            // Update HR stats
            await tx.hR.update({
                where: {
                    id: user.HR.id
                },
                data: {
                    totalJobsPosted: {
                        decrement: 1
                    },
                    activeJobs: job.status === _client.JobStatus.ACTIVE ? {
                        decrement: 1
                    } : undefined
                }
            });
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.DELETE,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: {
                        title: job.title,
                        status: job.status
                    }
                }
            });
        });
        return {
            message: 'Job deleted successfully'
        };
    }
    /**
   * Get applications for HR's jobs
   */ async getApplications(userId, filters) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                HR: true
            }
        });
        if (!user || !user.HR) {
            throw new _common.NotFoundException('HR profile not found');
        }
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            Job: {
                hrId: user.HR.id
            }
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
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    status: true,
                    testScore: true,
                    testPassedAt: true,
                    createdAt: true,
                    Candidate: {
                        select: {
                            firstName: true,
                            lastName: true,
                            headline: true,
                            totalExperience: true,
                            currentCompany: true,
                            resumeUrl: true,
                            city: true,
                            state: true,
                            country: true,
                            User: {
                                select: {
                                    email: true,
                                    phone: true
                                }
                            },
                            CandidateSkill: {
                                select: {
                                    name: true,
                                    level: true
                                }
                            },
                            Experience: {
                                select: {
                                    role: true,
                                    company: true,
                                    startDate: true,
                                    endDate: true,
                                    isCurrent: true
                                },
                                orderBy: {
                                    startDate: 'desc'
                                },
                                take: 3
                            },
                            Education: {
                                select: {
                                    degree: true,
                                    institution: true,
                                    endYear: true
                                },
                                orderBy: {
                                    endYear: 'desc'
                                },
                                take: 2
                            }
                        }
                    },
                    Job: {
                        select: {
                            id: true,
                            title: true,
                            companyName: true
                        }
                    },
                    Interview: {
                        select: {
                            id: true,
                            status: true,
                            paymentStatus: true,
                            paidAt: true,
                            scheduledDate: true,
                            scheduledTime: true,
                            mode: true
                        }
                    }
                }
            }),
            this.prisma.jobApplication.count({
                where
            })
        ]);
        // Filter out applications with missing candidate or job data
        const validApplications = applications.filter((app)=>app.Candidate && app.Job);
        return {
            applications: validApplications,
            pagination: {
                page,
                limit,
                total: validApplications.length,
                totalPages: Math.ceil(validApplications.length / limit)
            }
        };
    }
    // Reject an application
    async rejectApplication(userId, applicationId, reason) {
        // First verify the HR has access to this application
        const hr = await this.prisma.hR.findUnique({
            where: {
                userId
            }
        });
        if (!hr) {
            throw new _common.NotFoundException('HR profile not found');
        }
        // Find the application and verify it belongs to one of HR's jobs
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            },
            include: {
                Job: true
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        if (application.Job.hrId !== hr.id) {
            throw new _common.ForbiddenException('You do not have access to this application');
        }
        // Update the application status to REJECTED
        const updatedApplication = await this.prisma.jobApplication.update({
            where: {
                id: applicationId
            },
            data: {
                status: 'REJECTED',
                updatedAt: new Date()
            }
        });
        return {
            message: 'Application rejected successfully',
            applicationId: updatedApplication.id,
            status: 'REJECTED'
        };
    }
    constructor(prisma, tokenService){
        this.prisma = prisma;
        this.tokenService = tokenService;
    }
};
HRService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _tokenservice.TokenService === "undefined" ? Object : _tokenservice.TokenService
    ])
], HRService);

//# sourceMappingURL=hr.service.js.map