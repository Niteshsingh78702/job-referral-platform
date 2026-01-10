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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map