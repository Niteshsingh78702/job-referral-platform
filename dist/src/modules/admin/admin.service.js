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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardMetrics() {
        const [totalUsers, totalCandidates, totalHRs, totalEmployees, totalJobs, activeJobs, totalPayments, totalRevenue, pendingRefunds, todayApplications,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: constants_1.UserRole.CANDIDATE } }),
            this.prisma.user.count({ where: { role: constants_1.UserRole.HR } }),
            this.prisma.user.count({ where: { role: constants_1.UserRole.EMPLOYEE } }),
            this.prisma.job.count(),
            this.prisma.job.count({ where: { status: constants_1.JobStatus.ACTIVE } }),
            this.prisma.payment.count({ where: { status: constants_1.PaymentStatus.SUCCESS } }),
            this.prisma.payment.aggregate({
                where: { status: constants_1.PaymentStatus.SUCCESS },
                _sum: { amount: true },
            }),
            this.prisma.refund.count({ where: { status: constants_1.RefundStatus.REQUESTED } }),
            this.prisma.jobApplication.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
        ]);
        return {
            users: {
                total: totalUsers,
                candidates: totalCandidates,
                hrs: totalHRs,
                employees: totalEmployees,
            },
            jobs: {
                total: totalJobs,
                active: activeJobs,
            },
            revenue: {
                totalPayments,
                totalAmount: totalRevenue._sum.amount || 0,
                pendingRefunds,
            },
            activity: {
                todayApplications,
            },
        };
    }
    async getAllUsers(page = 1, limit = 20, role, status) {
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    candidate: { select: { firstName: true, lastName: true } },
                    hr: { select: { companyName: true, approvalStatus: true } },
                    employee: { select: { companyName: true, referralCount: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async blockUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { status: constants_1.UserStatus.BLOCKED },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'block' },
                },
            });
        });
        return { success: true, message: 'User blocked' };
    }
    async unblockUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { status: constants_1.UserStatus.ACTIVE },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'unblock' },
                },
            });
        });
        return { success: true, message: 'User unblocked' };
    }
    async getPendingHRApprovals() {
        return this.prisma.hR.findMany({
            where: { approvalStatus: constants_1.HRApprovalStatus.PENDING },
            include: {
                user: { select: { email: true, createdAt: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async approveHR(hrId, adminId) {
        const hr = await this.prisma.hR.findUnique({ where: { id: hrId } });
        if (!hr)
            throw new common_1.NotFoundException('HR not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.hR.update({
                where: { id: hrId },
                data: {
                    approvalStatus: constants_1.HRApprovalStatus.APPROVED,
                    approvedBy: adminId,
                    approvedAt: new Date(),
                },
            });
            await tx.user.update({
                where: { id: hr.userId },
                data: { status: constants_1.UserStatus.ACTIVE },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: { action: 'approve' },
                },
            });
        });
        return { success: true, message: 'HR approved' };
    }
    async rejectHR(hrId, adminId, reason) {
        const hr = await this.prisma.hR.findUnique({ where: { id: hrId } });
        if (!hr)
            throw new common_1.NotFoundException('HR not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.hR.update({
                where: { id: hrId },
                data: {
                    approvalStatus: constants_1.HRApprovalStatus.REJECTED,
                    rejectionReason: reason,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: { action: 'reject', reason },
                },
            });
        });
        return { success: true, message: 'HR rejected' };
    }
    async getAllJobs(page = 1, limit = 20, status) {
        const where = {};
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                include: {
                    hr: { select: { companyName: true } },
                    _count: { select: { applications: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.job.count({ where }),
        ]);
        return {
            data: jobs,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async approveJob(jobId, adminId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.job.update({
                where: { id: jobId },
                data: {
                    status: constants_1.JobStatus.ACTIVE,
                    postedAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'approve' },
                },
            });
        });
        return { success: true, message: 'Job approved' };
    }
    async expireJob(jobId, adminId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.job.update({
                where: { id: jobId },
                data: { status: constants_1.JobStatus.EXPIRED },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'expire' },
                },
            });
        });
        return { success: true, message: 'Job expired' };
    }
    async createJob(jobData, adminId) {
        const baseSlug = (jobData.title || 'job')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `${baseSlug}-${randomSuffix}`;
        const newJob = await this.prisma.job.create({
            data: {
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
                status: constants_1.JobStatus.ACTIVE,
                postedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: newJob.id,
                metadata: { action: 'create', jobData },
            },
        });
        return { success: true, message: 'Job created successfully', data: newJob };
    }
    async updateJob(jobId, jobData, adminId) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: jobData,
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: jobId,
                metadata: { action: 'update', changes: jobData },
            },
        });
        return { success: true, message: 'Job updated successfully', data: updatedJob };
    }
    async deleteJob(jobId, adminId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { _count: { select: { applications: true } } },
        });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        if (job._count.applications > 0) {
            throw new common_1.BadRequestException(`Cannot delete job with ${job._count.applications} applications. Please expire the job instead.`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.job.delete({ where: { id: jobId } });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'delete', jobTitle: job.title },
                },
            });
        });
        return { success: true, message: 'Job deleted successfully' };
    }
    async getAllCandidates(page = 1, limit = 20, search) {
        const where = { role: constants_1.UserRole.CANDIDATE };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { candidate: { firstName: { contains: search, mode: 'insensitive' } } },
                { candidate: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const skip = (page - 1) * limit;
        const [candidates, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    candidate: {
                        include: {
                            applications: {
                                include: {
                                    job: { select: { title: true, companyName: true } },
                                },
                                orderBy: { createdAt: 'desc' },
                                take: 5,
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: candidates,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async deleteUser(userId, adminId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                candidate: { include: { _count: { select: { applications: true } } } },
                hr: true,
                employee: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === constants_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Cannot delete admin users');
        }
        if (user.candidate && user.candidate._count.applications > 0) {
            throw new common_1.BadRequestException('Cannot delete user with active applications. Please block the user instead.');
        }
        await this.prisma.$transaction(async (tx) => {
            if (user.candidate) {
                await tx.candidate.delete({ where: { userId } });
            }
            if (user.hr) {
                await tx.hR.delete({ where: { userId } });
            }
            if (user.employee) {
                await tx.employee.delete({ where: { userId } });
            }
            await tx.user.delete({ where: { id: userId } });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'delete', email: user.email, role: user.role },
                },
            });
        });
        return { success: true, message: 'User deleted successfully' };
    }
    async getAllPayments(page = 1, limit = 20, status) {
        const where = {};
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                include: {
                    application: {
                        include: {
                            candidate: { select: { firstName: true, lastName: true } },
                            job: { select: { title: true, companyName: true } },
                        },
                    },
                    refund: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            data: payments,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getPendingRefunds() {
        return this.prisma.refund.findMany({
            where: { status: constants_1.RefundStatus.REQUESTED },
            include: {
                payment: {
                    include: {
                        application: {
                            include: {
                                candidate: { select: { firstName: true, lastName: true } },
                                job: { select: { title: true, companyName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async approveRefund(refundId, adminId, notes) {
        const refund = await this.prisma.refund.findUnique({
            where: { id: refundId },
            include: { payment: true },
        });
        if (!refund)
            throw new common_1.NotFoundException('Refund not found');
        if (refund.status !== constants_1.RefundStatus.REQUESTED) {
            throw new common_1.BadRequestException('Refund already processed');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.refund.update({
                where: { id: refundId },
                data: {
                    status: constants_1.RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: notes,
                },
            });
            await tx.payment.update({
                where: { id: refund.paymentId },
                data: { status: constants_1.PaymentStatus.REFUNDED },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: { action: 'approve', notes },
                },
            });
        });
        return { success: true, message: 'Refund approved' };
    }
    async rejectRefund(refundId, adminId, reason) {
        const refund = await this.prisma.refund.findUnique({
            where: { id: refundId },
        });
        if (!refund)
            throw new common_1.NotFoundException('Refund not found');
        if (refund.status !== constants_1.RefundStatus.REQUESTED) {
            throw new common_1.BadRequestException('Refund already processed');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.refund.update({
                where: { id: refundId },
                data: {
                    status: constants_1.RefundStatus.REJECTED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: reason,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: { action: 'reject', reason },
                },
            });
        });
        return { success: true, message: 'Refund rejected' };
    }
    async getAuditLogs(page = 1, limit = 50, action) {
        const where = {};
        if (action)
            where.action = action;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: logs,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAllInterviews(page = 1, limit = 20, status) {
        const where = {};
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [interviews, total] = await Promise.all([
            this.prisma.interview.findMany({
                where,
                skip,
                take: limit,
                include: {
                    application: {
                        include: {
                            candidate: { select: { firstName: true, lastName: true } },
                            job: { select: { title: true, companyName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.interview.count({ where }),
        ]);
        return {
            data: interviews,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getInterviewStats() {
        const [total, interviewConfirmed, paymentSuccess, completed, candidateNoShow, hrNoShow, cancelled,] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_CONFIRMED' } }),
            this.prisma.interview.count({ where: { status: 'PAYMENT_SUCCESS' } }),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_COMPLETED' } }),
            this.prisma.interview.count({ where: { status: 'CANDIDATE_NO_SHOW' } }),
            this.prisma.interview.count({ where: { status: 'HR_NO_SHOW' } }),
            this.prisma.interview.count({ where: { status: 'CANCELLED' } }),
        ]);
        const totalCompleted = completed + candidateNoShow + hrNoShow;
        const noShowRate = totalCompleted > 0
            ? (((candidateNoShow + hrNoShow) / totalCompleted) * 100).toFixed(2)
            : '0.00';
        return {
            total,
            byStatus: {
                interviewConfirmed,
                paymentSuccess,
                completed,
                candidateNoShow,
                hrNoShow,
                cancelled,
            },
            noShowRate: `${noShowRate}%`,
            completionRate: total > 0
                ? `${((completed / total) * 100).toFixed(2)}%`
                : '0.00%',
        };
    }
    async updateInterviewStatus(interviewId, newStatus, adminId, reason) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview)
            throw new common_1.NotFoundException('Interview not found');
        const oldStatus = interview.status;
        await this.prisma.$transaction(async (tx) => {
            const updateData = { status: newStatus };
            if (newStatus === 'INTERVIEW_COMPLETED') {
                updateData.completedAt = new Date();
            }
            await tx.interview.update({
                where: { id: interviewId },
                data: updateData,
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    oldValue: { status: oldStatus },
                    newValue: { status: newStatus },
                    metadata: { action: 'status_change', reason },
                },
            });
        });
        return { success: true, message: `Interview status updated to ${newStatus}` };
    }
    async markInterviewCompleted(interviewId, adminId, notes) {
        return this.updateInterviewStatus(interviewId, 'INTERVIEW_COMPLETED', adminId, notes);
    }
    async markInterviewNoShow(interviewId, adminId, noShowType, notes) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        candidate: { select: { userId: true } },
                        job: { include: { hr: { select: { userId: true } } } },
                    },
                },
            },
        });
        if (!interview)
            throw new common_1.NotFoundException('Interview not found');
        await this.prisma.$transaction(async (tx) => {
            const noShowStatus = noShowType === 'CANDIDATE' ? 'CANDIDATE_NO_SHOW' : 'HR_NO_SHOW';
            await tx.interview.update({
                where: { id: interviewId },
                data: { status: noShowStatus },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    metadata: {
                        action: 'no_show',
                        noShowType,
                        notes,
                        candidateId: interview.application.candidateId,
                        jobId: interview.application.jobId,
                    },
                },
            });
        });
        return {
            success: true,
            message: `Interview marked as no-show (${noShowType})`,
        };
    }
    async getAllSkillBuckets(includeInactive = false) {
        return this.prisma.skillBucket.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestions: true,
                    },
                },
                testTemplate: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        passingCriteria: true,
                    },
                },
                _count: {
                    select: {
                        jobs: true,
                        attempts: true,
                        jobRequirements: true,
                    },
                },
            },
            orderBy: { code: 'asc' },
        });
    }
    async createSkillBucket(data, adminId) {
        const existing = await this.prisma.skillBucket.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Skill bucket with code '${data.code}' already exists`);
        }
        const skillBucket = await this.prisma.skillBucket.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                displayName: data.displayName || `HR Shortlisting Check - ${data.name}`,
                experienceMin: data.experienceMin ?? 0,
                experienceMax: data.experienceMax ?? 3,
                testId: data.testId,
                testTemplateId: data.testTemplateId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.CREATE,
                entityType: 'SkillBucket',
                entityId: skillBucket.id,
                newValue: data,
            },
        });
        return { success: true, message: 'Skill bucket created', data: skillBucket };
    }
    async updateSkillBucket(id, data, adminId) {
        const existing = await this.prisma.skillBucket.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Skill bucket not found');
        const updated = await this.prisma.skillBucket.update({
            where: { id },
            data,
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.UPDATE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: existing,
                newValue: data,
            },
        });
        return { success: true, message: 'Skill bucket updated', data: updated };
    }
    async deleteSkillBucket(id, adminId) {
        const bucket = await this.prisma.skillBucket.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        jobs: true,
                        attempts: true,
                        jobRequirements: true,
                    },
                },
            },
        });
        if (!bucket)
            throw new common_1.NotFoundException('Skill bucket not found');
        if (bucket._count.jobs > 0 || bucket._count.jobRequirements > 0) {
            throw new common_1.BadRequestException(`Cannot delete skill bucket: it is assigned to ${bucket._count.jobs + bucket._count.jobRequirements} job(s). Deactivate it instead.`);
        }
        if (bucket._count.attempts > 0) {
            await this.prisma.skillBucket.update({
                where: { id },
                data: { isActive: false },
            });
            await this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.UPDATE,
                    entityType: 'SkillBucket',
                    entityId: id,
                    metadata: { action: 'deactivate', reason: 'has_attempts' },
                },
            });
            return { success: true, message: 'Skill bucket deactivated (has test attempts)' };
        }
        await this.prisma.skillBucket.delete({ where: { id } });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.DELETE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: bucket,
            },
        });
        return { success: true, message: 'Skill bucket deleted' };
    }
    async addSkillRequirementToJob(jobId, skillBucketId, adminId) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        const bucket = await this.prisma.skillBucket.findUnique({ where: { id: skillBucketId } });
        if (!bucket)
            throw new common_1.NotFoundException('Skill bucket not found');
        const requirement = await this.prisma.jobRequiredSkillBucket.upsert({
            where: {
                jobId_skillBucketId: { jobId, skillBucketId },
            },
            create: {
                jobId,
                skillBucketId,
            },
            update: {},
            include: {
                skillBucket: true,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.CREATE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: { jobId, skillBucketId, skillBucketCode: bucket.code },
            },
        });
        return { success: true, message: 'Skill requirement added to job', data: requirement };
    }
    async removeSkillRequirementFromJob(jobId, skillBucketId, adminId) {
        const requirement = await this.prisma.jobRequiredSkillBucket.findUnique({
            where: {
                jobId_skillBucketId: { jobId, skillBucketId },
            },
        });
        if (!requirement)
            throw new common_1.NotFoundException('Skill requirement not found for this job');
        await this.prisma.jobRequiredSkillBucket.delete({
            where: {
                jobId_skillBucketId: { jobId, skillBucketId },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: constants_1.AuditAction.DELETE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: { jobId, skillBucketId },
            },
        });
        return { success: true, message: 'Skill requirement removed from job' };
    }
    async getJobSkillRequirements(jobId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                skillBucket: true,
                requiredSkillBuckets: {
                    include: {
                        skillBucket: true,
                    },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        return {
            jobId: job.id,
            jobTitle: job.title,
            legacySkillBucket: job.skillBucket,
            compositeRequirements: job.requiredSkillBuckets,
        };
    }
    async updatePaymentStatus(paymentId, newStatus, adminId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const oldStatus = payment.status;
        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: newStatus,
                    ...(newStatus === constants_1.PaymentStatus.SUCCESS && { paidAt: new Date() }),
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Payment',
                    entityId: paymentId,
                    oldValue: { status: oldStatus },
                    newValue: { status: newStatus },
                    metadata: { action: 'status_override', reason },
                },
            });
        });
        return { success: true, message: `Payment status updated to ${newStatus}` };
    }
    async issueManualRefund(paymentId, adminId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { refund: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== constants_1.PaymentStatus.SUCCESS) {
            throw new common_1.BadRequestException('Can only refund successful payments');
        }
        if (payment.refund) {
            throw new common_1.BadRequestException('Payment already has a refund request');
        }
        await this.prisma.$transaction(async (tx) => {
            const refund = await tx.refund.create({
                data: {
                    paymentId,
                    amount: payment.amount,
                    reason: `ADMIN REFUND: ${reason}`,
                    status: constants_1.RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: 'Manual refund by admin',
                },
            });
            await tx.payment.update({
                where: { id: paymentId },
                data: { status: constants_1.PaymentStatus.REFUNDED },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: constants_1.AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refund.id,
                    metadata: { action: 'manual_refund', reason, amount: payment.amount },
                },
            });
        });
        return { success: true, message: 'Manual refund issued successfully' };
    }
    async getRevenueReport(startDate, endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = startDate;
        if (endDate)
            dateFilter.lte = endDate;
        const payments = await this.prisma.payment.findMany({
            where: {
                status: constants_1.PaymentStatus.SUCCESS,
                ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
            },
            select: {
                amount: true,
                paidAt: true,
                currency: true,
            },
            orderBy: { paidAt: 'desc' },
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const refunds = await this.prisma.refund.aggregate({
            where: {
                status: constants_1.RefundStatus.APPROVED,
                ...(Object.keys(dateFilter).length > 0 && { processedAt: dateFilter }),
            },
            _sum: { amount: true },
        });
        const netRevenue = totalRevenue - (refunds._sum.amount || 0);
        const dailyRevenue = {};
        for (const p of payments) {
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
                transactionCount: payments.length,
            },
            dailyBreakdown: Object.entries(dailyRevenue).map(([date, amount]) => ({
                date,
                amount,
            })),
        };
    }
    async getEnhancedAnalytics() {
        const [totalCandidates, totalHRs, activeUsers, blockedUsers, totalTestAttempts, passedTests, failedTests, totalInterviews, completedInterviews, scheduledInterviews, totalPayments, successfulPayments, refundedPayments,] = await Promise.all([
            this.prisma.user.count({ where: { role: constants_1.UserRole.CANDIDATE } }),
            this.prisma.user.count({ where: { role: constants_1.UserRole.HR } }),
            this.prisma.user.count({ where: { status: constants_1.UserStatus.ACTIVE } }),
            this.prisma.user.count({ where: { status: constants_1.UserStatus.BLOCKED } }),
            this.prisma.skillTestAttempt.count(),
            this.prisma.skillTestAttempt.count({ where: { isPassed: true } }),
            this.prisma.skillTestAttempt.count({ where: { isPassed: false } }),
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_COMPLETED' } }),
            this.prisma.interview.count({ where: { status: 'PAYMENT_SUCCESS' } }),
            this.prisma.payment.count(),
            this.prisma.payment.count({ where: { status: constants_1.PaymentStatus.SUCCESS } }),
            this.prisma.payment.count({ where: { status: constants_1.PaymentStatus.REFUNDED } }),
        ]);
        const testPassRate = totalTestAttempts > 0
            ? ((passedTests / totalTestAttempts) * 100).toFixed(2)
            : '0.00';
        const interviewCompletionRate = totalInterviews > 0
            ? ((completedInterviews / totalInterviews) * 100).toFixed(2)
            : '0.00';
        return {
            users: {
                totalCandidates,
                totalHRs,
                activeUsers,
                blockedUsers,
            },
            tests: {
                totalAttempts: totalTestAttempts,
                passed: passedTests,
                failed: failedTests,
                passRate: `${testPassRate}%`,
            },
            interviews: {
                total: totalInterviews,
                completed: completedInterviews,
                scheduled: scheduledInterviews,
                completionRate: `${interviewCompletionRate}%`,
            },
            payments: {
                total: totalPayments,
                successful: successfulPayments,
                refunded: refundedPayments,
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map