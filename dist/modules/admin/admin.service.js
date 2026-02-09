"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminService", {
    enumerable: true,
    get: function() {
        return AdminService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../../common/constants");
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
let AdminService = class AdminService {
    // ===========================================
    // DASHBOARD
    // ===========================================
    async getDashboardMetrics() {
        const [totalUsers, totalCandidates, totalHRs, totalEmployees, totalJobs, activeJobs, totalPayments, totalRevenue, pendingRefunds, todayApplications] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({
                where: {
                    role: _constants.UserRole.CANDIDATE
                }
            }),
            this.prisma.user.count({
                where: {
                    role: _constants.UserRole.HR
                }
            }),
            this.prisma.user.count({
                where: {
                    role: _constants.UserRole.EMPLOYEE
                }
            }),
            this.prisma.job.count(),
            this.prisma.job.count({
                where: {
                    status: _constants.JobStatus.ACTIVE
                }
            }),
            this.prisma.payment.count({
                where: {
                    status: _constants.PaymentStatus.SUCCESS
                }
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: _constants.PaymentStatus.SUCCESS
                },
                _sum: {
                    amount: true
                }
            }),
            this.prisma.refund.count({
                where: {
                    status: _constants.RefundStatus.REQUESTED
                }
            }),
            this.prisma.jobApplication.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);
        return {
            users: {
                total: totalUsers,
                candidates: totalCandidates,
                hrs: totalHRs,
                employees: totalEmployees
            },
            jobs: {
                total: totalJobs,
                active: activeJobs
            },
            revenue: {
                totalPayments,
                totalAmount: totalRevenue._sum.amount || 0,
                pendingRefunds
            },
            activity: {
                todayApplications
            }
        };
    }
    // ===========================================
    // USER MANAGEMENT
    // ===========================================
    async getAllUsers(page = 1, limit = 20, role, status) {
        const where = {};
        if (role) where.role = role;
        if (status) where.status = status;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    Candidate: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    HR: {
                        select: {
                            companyName: true,
                            approvalStatus: true
                        }
                    },
                    Employee: {
                        select: {
                            companyName: true,
                            referralCount: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.user.count({
                where
            })
        ]);
        return {
            data: users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async blockUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    status: _constants.UserStatus.BLOCKED
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: {
                        action: 'block'
                    }
                }
            });
        });
        return {
            success: true,
            message: 'User blocked'
        };
    }
    async unblockUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    status: _constants.UserStatus.ACTIVE
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: {
                        action: 'unblock'
                    }
                }
            });
        });
        return {
            success: true,
            message: 'User unblocked'
        };
    }
    // ===========================================
    // HR APPROVAL
    // ===========================================
    async getPendingHRApprovals() {
        return this.prisma.hR.findMany({
            where: {
                approvalStatus: _constants.HRApprovalStatus.PENDING
            },
            include: {
                User: {
                    select: {
                        email: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }
    async approveHR(hrId, adminId) {
        const hr = await this.prisma.hR.findUnique({
            where: {
                id: hrId
            }
        });
        if (!hr) throw new _common.NotFoundException('HR not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.hR.update({
                where: {
                    id: hrId
                },
                data: {
                    approvalStatus: _constants.HRApprovalStatus.APPROVED,
                    approvedBy: adminId,
                    approvedAt: new Date()
                }
            });
            await tx.user.update({
                where: {
                    id: hr.userId
                },
                data: {
                    status: _constants.UserStatus.ACTIVE
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: {
                        action: 'approve'
                    }
                }
            });
        });
        return {
            success: true,
            message: 'HR approved'
        };
    }
    async rejectHR(hrId, adminId, reason) {
        const hr = await this.prisma.hR.findUnique({
            where: {
                id: hrId
            }
        });
        if (!hr) throw new _common.NotFoundException('HR not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.hR.update({
                where: {
                    id: hrId
                },
                data: {
                    approvalStatus: _constants.HRApprovalStatus.REJECTED,
                    rejectionReason: reason
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: {
                        action: 'reject',
                        reason
                    }
                }
            });
        });
        return {
            success: true,
            message: 'HR rejected'
        };
    }
    // ===========================================
    // JOB MANAGEMENT
    // ===========================================
    async getAllJobs(page = 1, limit = 20, status) {
        const where = {};
        if (status) where.status = status;
        const skip = (page - 1) * limit;
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                include: {
                    HR: {
                        select: {
                            companyName: true
                        }
                    },
                    _count: {
                        select: {
                            JobApplication: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.job.count({
                where
            })
        ]);
        return {
            data: jobs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async approveJob(jobId, adminId) {
        await this.prisma.$transaction(async (tx)=>{
            await tx.job.update({
                where: {
                    id: jobId
                },
                data: {
                    status: _constants.JobStatus.ACTIVE,
                    postedAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: {
                        action: 'approve'
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Job approved'
        };
    }
    async expireJob(jobId, adminId) {
        await this.prisma.$transaction(async (tx)=>{
            await tx.job.update({
                where: {
                    id: jobId
                },
                data: {
                    status: _constants.JobStatus.EXPIRED
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: {
                        action: 'expire'
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Job expired'
        };
    }
    async createJob(jobData, adminId) {
        // Generate slug from title
        const baseSlug = (jobData.title || 'job').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `${baseSlug}-${randomSuffix}`;
        const newJob = await this.prisma.job.create({
            data: {
                id: _crypto.randomUUID(),
                slug,
                title: jobData.title,
                description: jobData.description || '',
                companyName: jobData.companyName,
                location: jobData.location,
                salaryMin: jobData.salaryMin,
                salaryMax: jobData.salaryMax,
                experienceMin: jobData.experienceMin || 0,
                experienceMax: jobData.experienceMax,
                referralFee: jobData.referralFee || 499,
                status: _constants.JobStatus.ACTIVE,
                postedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: newJob.id,
                metadata: {
                    action: 'create',
                    jobData
                }
            }
        });
        return {
            success: true,
            message: 'Job created successfully',
            data: newJob
        };
    }
    async updateJob(jobId, jobData, adminId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            }
        });
        if (!job) throw new _common.NotFoundException('Job not found');
        const updatedJob = await this.prisma.job.update({
            where: {
                id: jobId
            },
            data: jobData
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: jobId,
                metadata: {
                    action: 'update',
                    changes: jobData
                }
            }
        });
        return {
            success: true,
            message: 'Job updated successfully',
            data: updatedJob
        };
    }
    async deleteJob(jobId, adminId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                _count: {
                    select: {
                        JobApplication: true
                    }
                }
            }
        });
        if (!job) throw new _common.NotFoundException('Job not found');
        // Check if there are applications
        if (job._count.JobApplication > 0) {
            throw new _common.BadRequestException(`Cannot delete job with ${job._count.JobApplication} applications. Please expire the job instead.`);
        }
        await this.prisma.$transaction(async (tx)=>{
            await tx.job.delete({
                where: {
                    id: jobId
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: {
                        action: 'delete',
                        jobTitle: job.title
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Job deleted successfully'
        };
    }
    // ===========================================
    // CANDIDATE MANAGEMENT
    // ===========================================
    async getAllCandidates(page = 1, limit = 20, search) {
        const where = {
            role: _constants.UserRole.CANDIDATE
        };
        if (search) {
            where.OR = [
                {
                    email: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    Candidate: {
                        firstName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    Candidate: {
                        lastName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }
        const skip = (page - 1) * limit;
        const [candidates, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    Candidate: {
                        include: {
                            JobApplication: {
                                include: {
                                    Job: {
                                        select: {
                                            title: true,
                                            companyName: true
                                        }
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                },
                                take: 5
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.user.count({
                where
            })
        ]);
        return {
            data: candidates,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async deleteUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                Candidate: {
                    include: {
                        _count: {
                            select: {
                                JobApplication: true,
                                SkillTestAttempt: true
                            }
                        }
                    }
                },
                HR: {
                    include: {
                        _count: {
                            select: {
                                Job: true
                            }
                        }
                    }
                },
                Employee: {
                    include: {
                        _count: {
                            select: {
                                Referral: true,
                                EmployeeEarning: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        if (user.role === _constants.UserRole.ADMIN) {
            throw new _common.BadRequestException('Cannot delete admin users');
        }
        // Check for active applications (candidates)
        if (user.Candidate && user.Candidate._count.JobApplication > 0) {
            throw new _common.BadRequestException('Cannot delete user with active applications. Please block the user instead.');
        }
        // Check for jobs (HR)
        if (user.HR && user.HR._count.Job > 0) {
            throw new _common.BadRequestException('Cannot delete HR with posted jobs. Please block the user instead.');
        }
        // Check for referrals or earnings (Employee)
        if (user.Employee && (user.Employee._count.Referral > 0 || user.Employee._count.EmployeeEarning > 0)) {
            throw new _common.BadRequestException('Cannot delete employee with referrals or earnings. Please block the user instead.');
        }
        await this.prisma.$transaction(async (tx)=>{
            // Delete related authentication and session records first
            await tx.oTPToken.deleteMany({
                where: {
                    userId
                }
            });
            await tx.refreshToken.deleteMany({
                where: {
                    userId
                }
            });
            await tx.passwordResetToken.deleteMany({
                where: {
                    userId
                }
            });
            await tx.deviceLog.deleteMany({
                where: {
                    userId
                }
            });
            await tx.notification.deleteMany({
                where: {
                    userId
                }
            });
            // Delete audit logs where user is the actor (set userId to null instead since FK allows null)
            await tx.auditLog.updateMany({
                where: {
                    userId
                },
                data: {
                    userId: null
                }
            });
            // Handle suspicious activities (set userId to null)
            await tx.suspiciousActivity.updateMany({
                where: {
                    userId
                },
                data: {
                    userId: null
                }
            });
            // Delete role-specific records
            if (user.Candidate) {
                // Delete skill test attempts (no cascade delete on this table)
                await tx.skillTestAttempt.deleteMany({
                    where: {
                        candidateId: user.Candidate.id
                    }
                });
                // CandidateSkill, Education, Experience have onDelete: Cascade, they auto-delete
                // CandidateTestAttempt has onDelete: Cascade, auto-deletes
                // Now delete the candidate
                await tx.candidate.delete({
                    where: {
                        userId
                    }
                });
            }
            if (user.HR) {
                await tx.hR.delete({
                    where: {
                        userId
                    }
                });
            }
            if (user.Employee) {
                await tx.employee.delete({
                    where: {
                        userId
                    }
                });
            }
            // Finally delete the user
            await tx.user.delete({
                where: {
                    id: userId
                }
            });
            // Log the action (with adminId as the actor)
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: {
                        action: 'delete',
                        email: user.email,
                        role: user.role
                    }
                }
            });
        });
        return {
            success: true,
            message: 'User deleted successfully'
        };
    }
    // ===========================================
    // APPLICATION MANAGEMENT
    // ===========================================
    async getAllApplications(page = 1, limit = 20, status, jobId, search) {
        const where = {};
        if (status) where.status = status;
        if (jobId) where.jobId = jobId;
        if (search) {
            where.OR = [
                {
                    Candidate: {
                        firstName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    Candidate: {
                        lastName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    Job: {
                        title: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    Job: {
                        companyName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }
        const skip = (page - 1) * limit;
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                skip,
                take: limit,
                include: {
                    Candidate: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            headline: true,
                            totalExperience: true
                        }
                    },
                    Job: {
                        select: {
                            id: true,
                            title: true,
                            companyName: true,
                            status: true
                        }
                    },
                    Interview: {
                        select: {
                            id: true,
                            status: true,
                            paymentStatus: true,
                            scheduledDate: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.jobApplication.count({
                where
            })
        ]);
        return {
            data: applications,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async updateApplicationStatus(applicationId, newStatus, adminId, reason) {
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            }
        });
        if (!application) throw new _common.NotFoundException('Application not found');
        const oldStatus = application.status;
        await this.prisma.$transaction(async (tx)=>{
            await tx.jobApplication.update({
                where: {
                    id: applicationId
                },
                data: {
                    status: newStatus
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'JobApplication',
                    entityId: applicationId,
                    oldValue: {
                        status: oldStatus
                    },
                    newValue: {
                        status: newStatus
                    },
                    metadata: {
                        action: 'status_override',
                        reason
                    }
                }
            });
        });
        return {
            success: true,
            message: `Application status updated to ${newStatus}`
        };
    }
    // ===========================================
    // PAYMENT & REFUND
    // ===========================================
    async getAllPayments(page = 1, limit = 20, status) {
        const where = {};
        if (status) where.status = status;
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    JobApplication: {
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
                    },
                    Refund: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.payment.count({
                where
            })
        ]);
        return {
            data: payments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getPendingRefunds() {
        return this.prisma.refund.findMany({
            where: {
                status: _constants.RefundStatus.REQUESTED
            },
            include: {
                Payment: {
                    include: {
                        JobApplication: {
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
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }
    async approveRefund(refundId, adminId, notes) {
        const refund = await this.prisma.refund.findUnique({
            where: {
                id: refundId
            },
            include: {
                Payment: true
            }
        });
        if (!refund) throw new _common.NotFoundException('Refund not found');
        if (refund.status !== _constants.RefundStatus.REQUESTED) {
            throw new _common.BadRequestException('Refund already processed');
        }
        await this.prisma.$transaction(async (tx)=>{
            await tx.refund.update({
                where: {
                    id: refundId
                },
                data: {
                    status: _constants.RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: notes
                }
            });
            await tx.payment.update({
                where: {
                    id: refund.paymentId
                },
                data: {
                    status: _constants.PaymentStatus.REFUNDED
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: {
                        action: 'approve',
                        notes
                    }
                }
            });
        });
        // TODO: Process actual Razorpay refund
        return {
            success: true,
            message: 'Refund approved'
        };
    }
    async rejectRefund(refundId, adminId, reason) {
        const refund = await this.prisma.refund.findUnique({
            where: {
                id: refundId
            }
        });
        if (!refund) throw new _common.NotFoundException('Refund not found');
        if (refund.status !== _constants.RefundStatus.REQUESTED) {
            throw new _common.BadRequestException('Refund already processed');
        }
        await this.prisma.$transaction(async (tx)=>{
            await tx.refund.update({
                where: {
                    id: refundId
                },
                data: {
                    status: _constants.RefundStatus.REJECTED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: reason
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: {
                        action: 'reject',
                        reason
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Refund rejected'
        };
    }
    // ===========================================
    // AUDIT LOGS
    // ===========================================
    async getAuditLogs(page = 1, limit = 50, action) {
        const where = {};
        if (action) where.action = action;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: {
                    User: {
                        select: {
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.auditLog.count({
                where
            })
        ]);
        return {
            data: logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    // ===========================================
    // INTERVIEW MANAGEMENT
    // ===========================================
    async getAllInterviews(page = 1, limit = 20, status) {
        const where = {};
        if (status) where.status = status;
        const skip = (page - 1) * limit;
        const [interviews, total] = await Promise.all([
            this.prisma.interview.findMany({
                where,
                skip,
                take: limit,
                include: {
                    JobApplication: {
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
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.interview.count({
                where
            })
        ]);
        return {
            data: interviews,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getInterviewStats() {
        const [total, interviewConfirmed, paymentSuccess, completed, candidateNoShow, hrNoShow, cancelled] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({
                where: {
                    status: 'INTERVIEW_CONFIRMED'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'PAYMENT_SUCCESS'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'INTERVIEW_COMPLETED'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'CANDIDATE_NO_SHOW'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'HR_NO_SHOW'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'CANCELLED'
                }
            })
        ]);
        // Calculate no-show rate
        const totalCompleted = completed + candidateNoShow + hrNoShow;
        const noShowRate = totalCompleted > 0 ? ((candidateNoShow + hrNoShow) / totalCompleted * 100).toFixed(2) : '0.00';
        return {
            total,
            byStatus: {
                interviewConfirmed,
                paymentSuccess,
                completed,
                candidateNoShow,
                hrNoShow,
                cancelled
            },
            noShowRate: `${noShowRate}%`,
            completionRate: total > 0 ? `${(completed / total * 100).toFixed(2)}%` : '0.00%'
        };
    }
    async updateInterviewStatus(interviewId, newStatus, adminId, reason) {
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            }
        });
        if (!interview) throw new _common.NotFoundException('Interview not found');
        const oldStatus = interview.status;
        await this.prisma.$transaction(async (tx)=>{
            const updateData = {
                status: newStatus
            };
            // Set appropriate timestamps based on new status
            if (newStatus === 'INTERVIEW_COMPLETED') {
                updateData.completedAt = new Date();
            }
            await tx.interview.update({
                where: {
                    id: interviewId
                },
                data: updateData
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: {
                        status: oldStatus
                    },
                    newValue: {
                        status: newStatus
                    },
                    metadata: {
                        action: 'status_change',
                        reason
                    }
                }
            });
        });
        return {
            success: true,
            message: `Interview status updated to ${newStatus}`
        };
    }
    async markInterviewCompleted(interviewId, adminId, notes) {
        return this.updateInterviewStatus(interviewId, 'INTERVIEW_COMPLETED', adminId, notes);
    }
    async markInterviewNoShow(interviewId, adminId, noShowType, notes) {
        const interview = await this.prisma.interview.findUnique({
            where: {
                id: interviewId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            select: {
                                userId: true
                            }
                        },
                        Job: {
                            include: {
                                HR: {
                                    select: {
                                        userId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!interview) throw new _common.NotFoundException('Interview not found');
        await this.prisma.$transaction(async (tx)=>{
            // Mark interview with appropriate no-show status
            const noShowStatus = noShowType === 'CANDIDATE' ? 'CANDIDATE_NO_SHOW' : 'HR_NO_SHOW';
            await tx.interview.update({
                where: {
                    id: interviewId
                },
                data: {
                    status: noShowStatus
                }
            });
            // Log the no-show with details
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    metadata: {
                        action: 'no_show',
                        noShowType,
                        notes,
                        candidateId: interview.JobApplication?.candidateId || null,
                        jobId: interview.JobApplication?.jobId || null
                    }
                }
            });
        });
        return {
            success: true,
            message: `Interview marked as no-show (${noShowType})`
        };
    }
    // ===========================================
    // SKILL BUCKET MANAGEMENT
    // ===========================================
    async getAllSkillBuckets(includeInactive = false) {
        const buckets = await this.prisma.skillBucket.findMany({
            where: includeInactive ? {} : {
                isActive: true
            },
            include: {
                Test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true
                    }
                },
                TestTemplate: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        passingCriteria: true,
                        questionPoolSize: true,
                        selectionRoleType: true
                    }
                },
                _count: {
                    select: {
                        Job: true,
                        SkillTestAttempt: true,
                        JobRequiredSkillBucket: true
                    }
                }
            },
            orderBy: {
                code: 'asc'
            }
        });
        // For each bucket, count available questions from QuestionBank
        const bucketsWithQuestionCount = await Promise.all(buckets.map(async (bucket)=>{
            // Use TestTemplate.selectionRoleType if set, otherwise use bucket.code
            const roleType = bucket.TestTemplate?.selectionRoleType || bucket.code;
            const availableQuestions = await this.prisma.questionBank.count({
                where: {
                    roleType: roleType,
                    isActive: true
                }
            });
            return {
                ...bucket,
                availableQuestions
            };
        }));
        return bucketsWithQuestionCount;
    }
    async createSkillBucket(data, adminId) {
        // Check if code already exists
        const existing = await this.prisma.skillBucket.findUnique({
            where: {
                code: data.code
            }
        });
        if (existing) {
            throw new _common.BadRequestException(`Skill bucket with code '${data.code}' already exists`);
        }
        const skillBucket = await this.prisma.skillBucket.create({
            data: {
                id: _crypto.randomUUID(),
                code: data.code,
                name: data.name,
                description: data.description,
                displayName: data.displayName || `HR Shortlisting Check - ${data.name}`,
                experienceMin: data.experienceMin ?? 0,
                experienceMax: data.experienceMax ?? 3,
                ...data.testId && {
                    Test: {
                        connect: {
                            id: data.testId
                        }
                    }
                },
                ...data.testTemplateId && {
                    TestTemplate: {
                        connect: {
                            id: data.testTemplateId
                        }
                    }
                },
                updatedAt: new Date()
            }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.CREATE,
                entityType: 'SkillBucket',
                entityId: skillBucket.id,
                newValue: data
            }
        });
        return {
            success: true,
            message: 'Skill bucket created',
            data: skillBucket
        };
    }
    async updateSkillBucket(id, data, adminId) {
        const existing = await this.prisma.skillBucket.findUnique({
            where: {
                id
            }
        });
        if (!existing) throw new _common.NotFoundException('Skill bucket not found');
        const updated = await this.prisma.skillBucket.update({
            where: {
                id
            },
            data
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.UPDATE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: existing,
                newValue: data
            }
        });
        return {
            success: true,
            message: 'Skill bucket updated',
            data: updated
        };
    }
    async deleteSkillBucket(id, adminId) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id
            },
            include: {
                _count: {
                    select: {
                        Job: true,
                        SkillTestAttempt: true,
                        JobRequiredSkillBucket: true
                    }
                }
            }
        });
        if (!bucket) throw new _common.NotFoundException('Skill bucket not found');
        // Check if skill bucket is in use
        if (bucket._count.Job > 0 || bucket._count.JobRequiredSkillBucket > 0) {
            throw new _common.BadRequestException(`Cannot delete skill bucket: it is assigned to ${bucket._count.Job + bucket._count.JobRequiredSkillBucket} job(s). Deactivate it instead.`);
        }
        // If there are attempts, just deactivate instead of hard delete
        if (bucket._count.SkillTestAttempt > 0) {
            await this.prisma.skillBucket.update({
                where: {
                    id
                },
                data: {
                    isActive: false
                }
            });
            await this.prisma.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.UPDATE,
                    entityType: 'SkillBucket',
                    entityId: id,
                    metadata: {
                        action: 'deactivate',
                        reason: 'has_attempts'
                    }
                }
            });
            return {
                success: true,
                message: 'Skill bucket deactivated (has test attempts)'
            };
        }
        // Safe to hard delete
        await this.prisma.skillBucket.delete({
            where: {
                id
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.DELETE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: bucket
            }
        });
        return {
            success: true,
            message: 'Skill bucket deleted'
        };
    }
    // ===========================================
    // JOB SKILL REQUIREMENTS
    // ===========================================
    async addSkillRequirementToJob(jobId, skillBucketId, adminId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            }
        });
        if (!job) throw new _common.NotFoundException('Job not found');
        const bucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!bucket) throw new _common.NotFoundException('Skill bucket not found');
        const requirement = await this.prisma.jobRequiredSkillBucket.upsert({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            },
            create: {
                id: _crypto.randomUUID(),
                jobId,
                skillBucketId
            },
            update: {},
            include: {
                SkillBucket: true
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.CREATE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: {
                    jobId,
                    skillBucketId,
                    skillBucketCode: bucket.code
                }
            }
        });
        return {
            success: true,
            message: 'Skill requirement added to job',
            data: requirement
        };
    }
    async removeSkillRequirementFromJob(jobId, skillBucketId, adminId) {
        const requirement = await this.prisma.jobRequiredSkillBucket.findUnique({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            }
        });
        if (!requirement) throw new _common.NotFoundException('Skill requirement not found for this job');
        await this.prisma.jobRequiredSkillBucket.delete({
            where: {
                jobId_skillBucketId: {
                    jobId,
                    skillBucketId
                }
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.DELETE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: {
                    jobId,
                    skillBucketId
                }
            }
        });
        return {
            success: true,
            message: 'Skill requirement removed from job'
        };
    }
    async getJobSkillRequirements(jobId) {
        const job = await this.prisma.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                SkillBucket: true,
                JobRequiredSkillBucket: {
                    include: {
                        SkillBucket: true
                    },
                    orderBy: {
                        displayOrder: 'asc'
                    }
                }
            }
        });
        if (!job) throw new _common.NotFoundException('Job not found');
        return {
            jobId: job.id,
            jobTitle: job.title,
            legacySkillBucket: job.SkillBucket,
            compositeRequirements: job.JobRequiredSkillBucket
        };
    }
    // ===========================================
    // PAYMENT CONTROL (ADMIN OVERRIDE)
    // ===========================================
    async updatePaymentStatus(paymentId, newStatus, adminId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: paymentId
            }
        });
        if (!payment) throw new _common.NotFoundException('Payment not found');
        const oldStatus = payment.status;
        await this.prisma.$transaction(async (tx)=>{
            await tx.payment.update({
                where: {
                    id: paymentId
                },
                data: {
                    status: newStatus,
                    ...newStatus === _constants.PaymentStatus.SUCCESS && {
                        paidAt: new Date()
                    }
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Payment',
                    entityId: paymentId,
                    oldValue: {
                        status: oldStatus
                    },
                    newValue: {
                        status: newStatus
                    },
                    metadata: {
                        action: 'status_override',
                        reason
                    }
                }
            });
        });
        return {
            success: true,
            message: `Payment status updated to ${newStatus}`
        };
    }
    async issueManualRefund(paymentId, adminId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: paymentId
            },
            include: {
                Refund: true
            }
        });
        if (!payment) throw new _common.NotFoundException('Payment not found');
        if (payment.status !== _constants.PaymentStatus.SUCCESS) {
            throw new _common.BadRequestException('Can only refund successful payments');
        }
        if (payment.Refund) {
            throw new _common.BadRequestException('Payment already has a refund request');
        }
        await this.prisma.$transaction(async (tx)=>{
            // Create refund record
            const refund = await tx.refund.create({
                data: {
                    id: _crypto.randomUUID(),
                    paymentId,
                    amount: payment.amount,
                    reason: `ADMIN Refund: ${reason}`,
                    status: _constants.RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: 'Manual refund by admin',
                    updatedAt: new Date()
                }
            });
            // Update payment status
            await tx.payment.update({
                where: {
                    id: paymentId
                },
                data: {
                    status: _constants.PaymentStatus.REFUNDED
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refund.id,
                    metadata: {
                        action: 'manual_refund',
                        reason,
                        amount: payment.amount
                    }
                }
            });
        });
        // TODO: Process actual Razorpay refund
        return {
            success: true,
            message: 'Manual refund issued successfully'
        };
    }
    // ===========================================
    // REVENUE REPORTS
    // ===========================================
    async getRevenueReport(startDate, endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = startDate;
        if (endDate) dateFilter.lte = endDate;
        const payments = await this.prisma.payment.findMany({
            where: {
                status: _constants.PaymentStatus.SUCCESS,
                ...Object.keys(dateFilter).length > 0 && {
                    paidAt: dateFilter
                }
            },
            select: {
                amount: true,
                paidAt: true,
                currency: true
            },
            orderBy: {
                paidAt: 'desc'
            }
        });
        const totalRevenue = payments.reduce((sum, p)=>sum + p.amount, 0);
        const refunds = await this.prisma.refund.aggregate({
            where: {
                status: _constants.RefundStatus.APPROVED,
                ...Object.keys(dateFilter).length > 0 && {
                    processedAt: dateFilter
                }
            },
            _sum: {
                amount: true
            }
        });
        const netRevenue = totalRevenue - (refunds._sum.amount || 0);
        // Group by date for charting
        const dailyRevenue = {};
        for (const p of payments){
            if (p.paidAt) {
                const dateKey = p.paidAt.toISOString().split('T')[0];
                dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + p.amount;
            }
        }
        return {
            summary: {
                totalRevenue,
                totalRefunds: refunds._sum.amount || 0,
                netRevenue,
                transactionCount: payments.length
            },
            dailyBreakdown: Object.entries(dailyRevenue).map(([date, amount])=>({
                    date,
                    amount
                }))
        };
    }
    // ===========================================
    // ENHANCED ANALYTICS
    // ===========================================
    async getEnhancedAnalytics() {
        const [// User metrics
        totalCandidates, totalHRs, activeUsers, blockedUsers, // Test metrics
        totalTestAttempts, passedTests, failedTests, // Interview metrics
        totalInterviews, completedInterviews, scheduledInterviews, // Payment metrics
        totalPayments, successfulPayments, refundedPayments] = await Promise.all([
            this.prisma.user.count({
                where: {
                    role: _constants.UserRole.CANDIDATE
                }
            }),
            this.prisma.user.count({
                where: {
                    role: _constants.UserRole.HR
                }
            }),
            this.prisma.user.count({
                where: {
                    status: _constants.UserStatus.ACTIVE
                }
            }),
            this.prisma.user.count({
                where: {
                    status: _constants.UserStatus.BLOCKED
                }
            }),
            this.prisma.skillTestAttempt.count(),
            this.prisma.skillTestAttempt.count({
                where: {
                    isPassed: true
                }
            }),
            this.prisma.skillTestAttempt.count({
                where: {
                    isPassed: false
                }
            }),
            this.prisma.interview.count(),
            this.prisma.interview.count({
                where: {
                    status: 'INTERVIEW_COMPLETED'
                }
            }),
            this.prisma.interview.count({
                where: {
                    status: 'PAYMENT_SUCCESS'
                }
            }),
            this.prisma.payment.count(),
            this.prisma.payment.count({
                where: {
                    status: _constants.PaymentStatus.SUCCESS
                }
            }),
            this.prisma.payment.count({
                where: {
                    status: _constants.PaymentStatus.REFUNDED
                }
            })
        ]);
        const testPassRate = totalTestAttempts > 0 ? (passedTests / totalTestAttempts * 100).toFixed(2) : '0.00';
        const interviewCompletionRate = totalInterviews > 0 ? (completedInterviews / totalInterviews * 100).toFixed(2) : '0.00';
        return {
            users: {
                totalCandidates,
                totalHRs,
                activeUsers,
                blockedUsers
            },
            tests: {
                totalAttempts: totalTestAttempts,
                passed: passedTests,
                failed: failedTests,
                passRate: `${testPassRate}%`
            },
            interviews: {
                total: totalInterviews,
                completed: completedInterviews,
                scheduled: scheduledInterviews,
                completionRate: `${interviewCompletionRate}%`
            },
            Payment: {
                total: totalPayments,
                successful: successfulPayments,
                refunded: refundedPayments
            }
        };
    }
    // ===========================================
    // TEST OVERRIDE CONTROLS (ADMIN POWER FEATURES)
    // ===========================================
    /**
   * Admin manually marks a candidate as PASSED for a skill test
   * Creates a SkillTestAttempt with isPassed: true
   */ async manuallyPassTest(candidateId, skillBucketId, adminId, reason, validityDays = 7) {
        // Verify candidate exists
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                id: candidateId
            }
        });
        if (!candidate) throw new _common.NotFoundException('Candidate not found');
        // Verify skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!skillBucket) throw new _common.NotFoundException('Skill bucket not found');
        const now = new Date();
        const validTill = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                id: _crypto.randomUUID(),
                candidateId,
                skillBucketId,
                isPassed: true,
                score: 100,
                validTill,
                retestAllowedAt: null
            }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attempt.id,
                newValue: {
                    isPassed: true,
                    validTill,
                    validityDays,
                    reason
                },
                metadata: {
                    action: 'manual_pass',
                    candidateId,
                    skillBucketId
                }
            }
        });
        return {
            success: true,
            message: `Candidate manually passed for ${skillBucket.name}. Valid until ${validTill.toISOString()}`,
            attempt
        };
    }
    /**
   * Admin manually marks a candidate as FAILED for a skill test
   * Creates a SkillTestAttempt with isPassed: false and immediate retest allowed
   */ async manuallyFailTest(candidateId, skillBucketId, adminId, reason) {
        // Verify candidate exists
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                id: candidateId
            }
        });
        if (!candidate) throw new _common.NotFoundException('Candidate not found');
        // Verify skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({
            where: {
                id: skillBucketId
            }
        });
        if (!skillBucket) throw new _common.NotFoundException('Skill bucket not found');
        const now = new Date();
        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                candidateId,
                skillBucketId,
                isPassed: false,
                score: 0,
                validTill: null,
                retestAllowedAt: now
            }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attempt.id,
                newValue: {
                    isPassed: false,
                    reason
                },
                metadata: {
                    action: 'manual_fail',
                    candidateId,
                    skillBucketId
                }
            }
        });
        return {
            success: true,
            message: `Candidate manually failed for ${skillBucket.name}. Immediate retest allowed.`,
            attempt
        };
    }
    /**
   * Admin extends the validity of an existing test attempt
   */ async extendTestValidity(attemptId, newValidTill, adminId, reason) {
        const attempt = await this.prisma.skillTestAttempt.findUnique({
            where: {
                id: attemptId
            },
            include: {
                SkillBucket: true
            }
        });
        if (!attempt) throw new _common.NotFoundException('Test attempt not found');
        if (!attempt.isPassed) throw new _common.BadRequestException('Can only extend validity for passed tests');
        const oldValidTill = attempt.validTill;
        const updated = await this.prisma.skillTestAttempt.update({
            where: {
                id: attemptId
            },
            data: {
                validTill: newValidTill
            }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attemptId,
                oldValue: {
                    validTill: oldValidTill
                },
                newValue: {
                    validTill: newValidTill,
                    reason
                },
                metadata: {
                    action: 'extend_validity'
                }
            }
        });
        return {
            success: true,
            message: `Validity extended to ${newValidTill.toISOString()}`,
            attempt: updated
        };
    }
    /**
   * Admin resets the retest cooldown for a failed test attempt
   * Allows candidate to immediately retake the test
   */ async resetRetestCooldown(attemptId, adminId, reason) {
        const attempt = await this.prisma.skillTestAttempt.findUnique({
            where: {
                id: attemptId
            },
            include: {
                SkillBucket: true
            }
        });
        if (!attempt) throw new _common.NotFoundException('Test attempt not found');
        if (attempt.isPassed) throw new _common.BadRequestException('Cooldown reset only applies to failed tests');
        const now = new Date();
        const oldRetestAllowedAt = attempt.retestAllowedAt;
        const updated = await this.prisma.skillTestAttempt.update({
            where: {
                id: attemptId
            },
            data: {
                retestAllowedAt: now
            }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: _constants.AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attemptId,
                oldValue: {
                    retestAllowedAt: oldRetestAllowedAt
                },
                newValue: {
                    retestAllowedAt: now,
                    reason
                },
                metadata: {
                    action: 'reset_cooldown'
                }
            }
        });
        return {
            success: true,
            message: 'Retest cooldown reset. Candidate can now retake the test.',
            attempt: updated
        };
    }
    // ==========================================
    // FRAUD DETECTION: Suspicious Activity Management
    // ==========================================
    async getSuspiciousActivities(page = 1, limit = 20, isReviewed, activityType) {
        const where = {};
        if (isReviewed !== undefined) where.isReviewed = isReviewed;
        if (activityType) where.activityType = activityType;
        const skip = (page - 1) * limit;
        const [activities, total] = await Promise.all([
            this.prisma.suspiciousActivity.findMany({
                where,
                skip,
                take: limit,
                include: {
                    User: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.suspiciousActivity.count({
                where
            })
        ]);
        return {
            data: activities,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async reviewSuspiciousActivity(activityId, adminId, action, notes) {
        const activity = await this.prisma.suspiciousActivity.findUnique({
            where: {
                id: activityId
            },
            include: {
                User: true
            }
        });
        if (!activity) {
            throw new _common.NotFoundException('Suspicious activity not found');
        }
        await this.prisma.$transaction(async (tx)=>{
            // Mark as reviewed
            await tx.suspiciousActivity.update({
                where: {
                    id: activityId
                },
                data: {
                    isReviewed: true,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    reviewNotes: notes
                }
            });
            // If action is block_user, block the associated user
            if (action === 'block_user' && activity.userId) {
                await tx.user.update({
                    where: {
                        id: activity.userId
                    },
                    data: {
                        status: _constants.UserStatus.BLOCKED
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'SuspiciousActivity',
                    entityId: activityId,
                    metadata: {
                        action,
                        notes,
                        userBlocked: action === 'block_user'
                    }
                }
            });
        });
        return {
            success: true,
            message: action === 'block_user' ? 'Suspicious activity reviewed. User has been blocked.' : 'Suspicious activity dismissed.'
        };
    }
    async getHRFraudMetrics() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const hrStats = await this.prisma.hR.findMany({
            include: {
                Job: {
                    include: {
                        JobApplication: {
                            where: {
                                createdAt: {
                                    gte: thirtyDaysAgo
                                }
                            },
                            include: {
                                Interview: true
                            }
                        }
                    }
                },
                User: {
                    select: {
                        email: true,
                        status: true
                    }
                }
            }
        });
        const metrics = hrStats.map((hr)=>{
            const allInterviews = hr.Job.flatMap((job)=>job.JobApplication.map((app)=>app.Interview).filter(Boolean));
            const cancelledCount = allInterviews.filter((i)=>i?.status === 'CANCELLED').length;
            const noShowCount = allInterviews.filter((i)=>i?.status === 'HR_NO_SHOW').length;
            const totalInterviews = allInterviews.length;
            return {
                hrId: hr.id,
                email: hr.User.email,
                companyName: hr.companyName,
                userStatus: hr.User.status,
                totalInterviews,
                cancelledCount,
                noShowCount,
                cancellationRate: totalInterviews > 0 ? (cancelledCount / totalInterviews * 100).toFixed(1) : 0,
                noShowRate: totalInterviews > 0 ? (noShowCount / totalInterviews * 100).toFixed(1) : 0,
                isFlagged: cancelledCount > 3 || noShowCount > 2
            };
        });
        return {
            flaggedHRs: metrics.filter((m)=>m.isFlagged),
            allMetrics: metrics.sort((a, b)=>b.cancelledCount + b.noShowCount - (a.cancelledCount + a.noShowCount))
        };
    }
    // ===========================================
    // TESTIMONIAL MANAGEMENT
    // ===========================================
    async getAllTestimonials(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [testimonials, total] = await Promise.all([
            this.prisma.testimonial.findMany({
                skip,
                take: limit,
                orderBy: [
                    {
                        displayOrder: 'asc'
                    },
                    {
                        createdAt: 'desc'
                    }
                ]
            }),
            this.prisma.testimonial.count()
        ]);
        return {
            data: testimonials,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getPublicTestimonials(limit = 6) {
        return this.prisma.testimonial.findMany({
            where: {
                isActive: true
            },
            orderBy: [
                {
                    displayOrder: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ],
            take: limit
        });
    }
    async createTestimonial(data, adminId) {
        const testimonial = await this.prisma.testimonial.create({
            data: {
                candidateName: data.candidateName,
                role: data.role,
                company: data.company,
                interviewDate: new Date(data.interviewDate),
                quote: data.quote,
                imageUrl: data.imageUrl,
                rating: data.rating || 5,
                displayOrder: data.displayOrder || 0
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.CREATE,
                entityType: 'Testimonial',
                entityId: testimonial.id,
                metadata: {
                    candidateName: data.candidateName
                }
            }
        });
        return {
            success: true,
            message: 'Testimonial created',
            data: testimonial
        };
    }
    async updateTestimonial(id, data, adminId) {
        const testimonial = await this.prisma.testimonial.findUnique({
            where: {
                id
            }
        });
        if (!testimonial) throw new _common.NotFoundException('Testimonial not found');
        // Handle date conversion if present
        if (data.interviewDate) {
            data.interviewDate = new Date(data.interviewDate);
        }
        const updatedTestimonial = await this.prisma.testimonial.update({
            where: {
                id
            },
            data
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.UPDATE,
                entityType: 'Testimonial',
                entityId: id,
                metadata: {
                    changes: data
                }
            }
        });
        return {
            success: true,
            message: 'Testimonial updated',
            data: updatedTestimonial
        };
    }
    async deleteTestimonial(id, adminId) {
        const testimonial = await this.prisma.testimonial.findUnique({
            where: {
                id
            }
        });
        if (!testimonial) throw new _common.NotFoundException('Testimonial not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.testimonial.delete({
                where: {
                    id
                }
            });
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.DELETE,
                    entityType: 'Testimonial',
                    entityId: id,
                    metadata: {
                        candidateName: testimonial.candidateName
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Testimonial deleted'
        };
    }
    async toggleTestimonialStatus(id, adminId) {
        const testimonial = await this.prisma.testimonial.findUnique({
            where: {
                id
            }
        });
        if (!testimonial) throw new _common.NotFoundException('Testimonial not found');
        const updatedTestimonial = await this.prisma.testimonial.update({
            where: {
                id
            },
            data: {
                isActive: !testimonial.isActive
            }
        });
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId: adminId,
                action: _constants.AuditAction.UPDATE,
                entityType: 'Testimonial',
                entityId: id,
                metadata: {
                    action: 'toggle_status',
                    newStatus: !testimonial.isActive
                }
            }
        });
        return {
            success: true,
            message: `Testimonial ${updatedTestimonial.isActive ? 'activated' : 'deactivated'}`,
            data: updatedTestimonial
        };
    }
    // ==========================================
    // SITE SETTINGS
    // ==========================================
    async getAllSettings() {
        const settings = await this.prisma.siteSettings.findMany({
            orderBy: {
                key: 'asc'
            }
        });
        // Return as key-value object for easy access
        const settingsMap = {};
        settings.forEach((s)=>{
            settingsMap[s.key] = s.value;
        });
        return {
            data: settings,
            map: settingsMap
        };
    }
    async getPublicSettings() {
        // Get specific settings that are public (trust counters)
        const settings = await this.prisma.siteSettings.findMany({
            where: {
                key: {
                    in: [
                        'interviews_scheduled',
                        'candidates_selected'
                    ]
                }
            }
        });
        const result = {
            interviewsScheduled: 127,
            candidatesSelected: 38
        };
        settings.forEach((s)=>{
            if (s.key === 'interviews_scheduled') result.interviewsScheduled = parseInt(s.value) || 127;
            if (s.key === 'candidates_selected') result.candidatesSelected = parseInt(s.value) || 38;
        });
        return result;
    }
    async updateSetting(key, value, label, adminId) {
        const setting = await this.prisma.siteSettings.upsert({
            where: {
                key
            },
            create: {
                key,
                value,
                label: label || key,
                type: 'number'
            },
            update: {
                value
            }
        });
        if (adminId) {
            await this.prisma.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: adminId,
                    action: _constants.AuditAction.UPDATE,
                    entityType: 'SiteSettings',
                    entityId: key,
                    metadata: {
                        key,
                        value
                    }
                }
            });
        }
        return {
            success: true,
            message: 'Setting updated',
            data: setting
        };
    }
    async initializeDefaultSettings() {
        const defaults = [
            {
                key: 'interviews_scheduled',
                value: '127',
                label: 'Interviews Scheduled This Month',
                type: 'number'
            },
            {
                key: 'candidates_selected',
                value: '38',
                label: 'Candidates Selected',
                type: 'number'
            }
        ];
        for (const setting of defaults){
            await this.prisma.siteSettings.upsert({
                where: {
                    key: setting.key
                },
                create: setting,
                update: {}
            });
        }
        return {
            success: true,
            message: 'Default settings initialized'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map