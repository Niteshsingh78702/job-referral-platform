import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    UserStatus,
    UserRole,
    JobStatus,
    HRApprovalStatus,
    RefundStatus,
    PaymentStatus,
    AuditAction,
} from '../../common/constants';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // ===========================================
    // DASHBOARD
    // ===========================================

    async getDashboardMetrics() {
        const [
            totalUsers,
            totalCandidates,
            totalHRs,
            totalEmployees,
            totalJobs,
            activeJobs,
            totalPayments,
            totalRevenue,
            pendingRefunds,
            todayApplications,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: UserRole.CANDIDATE } }),
            this.prisma.user.count({ where: { role: UserRole.HR } }),
            this.prisma.user.count({ where: { role: UserRole.EMPLOYEE } }),
            this.prisma.job.count(),
            this.prisma.job.count({ where: { status: JobStatus.ACTIVE } }),
            this.prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
            this.prisma.payment.aggregate({
                where: { status: PaymentStatus.SUCCESS },
                _sum: { amount: true },
            }),
            this.prisma.refund.count({ where: { status: RefundStatus.REQUESTED } }),
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

    // ===========================================
    // USER MANAGEMENT
    // ===========================================

    async getAllUsers(page = 1, limit = 20, role?: UserRole, status?: UserStatus) {
        const where: any = {};
        if (role) where.role = role;
        if (status) where.status = status;

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

    async blockUser(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { status: UserStatus.BLOCKED },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'block' },
                },
            });
        });

        return { success: true, message: 'User blocked' };
    }

    async unblockUser(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { status: UserStatus.ACTIVE },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'unblock' },
                },
            });
        });

        return { success: true, message: 'User unblocked' };
    }

    // ===========================================
    // HR APPROVAL
    // ===========================================

    async getPendingHRApprovals() {
        return this.prisma.hR.findMany({
            where: { approvalStatus: HRApprovalStatus.PENDING },
            include: {
                user: { select: { email: true, createdAt: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async approveHR(hrId: string, adminId: string) {
        const hr = await this.prisma.hR.findUnique({ where: { id: hrId } });
        if (!hr) throw new NotFoundException('HR not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.hR.update({
                where: { id: hrId },
                data: {
                    approvalStatus: HRApprovalStatus.APPROVED,
                    approvedBy: adminId,
                    approvedAt: new Date(),
                },
            });

            await tx.user.update({
                where: { id: hr.userId },
                data: { status: UserStatus.ACTIVE },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: { action: 'approve' },
                },
            });
        });

        return { success: true, message: 'HR approved' };
    }

    async rejectHR(hrId: string, adminId: string, reason: string) {
        const hr = await this.prisma.hR.findUnique({ where: { id: hrId } });
        if (!hr) throw new NotFoundException('HR not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.hR.update({
                where: { id: hrId },
                data: {
                    approvalStatus: HRApprovalStatus.REJECTED,
                    rejectionReason: reason,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'HR',
                    entityId: hrId,
                    metadata: { action: 'reject', reason },
                },
            });
        });

        return { success: true, message: 'HR rejected' };
    }

    // ===========================================
    // JOB MANAGEMENT
    // ===========================================

    async getAllJobs(page = 1, limit = 20, status?: JobStatus) {
        const where: any = {};
        if (status) where.status = status;

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

    async approveJob(jobId: string, adminId: string) {
        await this.prisma.$transaction(async (tx) => {
            await tx.job.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.ACTIVE,
                    postedAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'approve' },
                },
            });
        });

        return { success: true, message: 'Job approved' };
    }

    async expireJob(jobId: string, adminId: string) {
        await this.prisma.$transaction(async (tx) => {
            await tx.job.update({
                where: { id: jobId },
                data: { status: JobStatus.EXPIRED },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'expire' },
                },
            });
        });

        return { success: true, message: 'Job expired' };
    }

    async createJob(jobData: any, adminId: string) {
        // Generate slug from title
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
                status: JobStatus.ACTIVE,
                postedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                // hrId is optional for admin-created jobs
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: newJob.id,
                metadata: { action: 'create', jobData },
            },
        });

        return { success: true, message: 'Job created successfully', data: newJob };
    }

    async updateJob(jobId: string, jobData: any, adminId: string) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Job not found');

        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data: jobData,
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'Job',
                entityId: jobId,
                metadata: { action: 'update', changes: jobData },
            },
        });

        return { success: true, message: 'Job updated successfully', data: updatedJob };
    }

    async deleteJob(jobId: string, adminId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { _count: { select: { applications: true } } },
        });

        if (!job) throw new NotFoundException('Job not found');

        // Check if there are applications
        if (job._count.applications > 0) {
            throw new BadRequestException(
                `Cannot delete job with ${job._count.applications} applications. Please expire the job instead.`
            );
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.job.delete({ where: { id: jobId } });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Job',
                    entityId: jobId,
                    metadata: { action: 'delete', jobTitle: job.title },
                },
            });
        });

        return { success: true, message: 'Job deleted successfully' };
    }

    // ===========================================
    // CANDIDATE MANAGEMENT
    // ===========================================

    async getAllCandidates(page = 1, limit = 20, search?: string) {
        const where: any = { role: UserRole.CANDIDATE };

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

    async deleteUser(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                candidate: { include: { _count: { select: { applications: true } } } },
                hr: true,
                employee: true,
            },
        });

        if (!user) throw new NotFoundException('User not found');
        if (user.role === UserRole.ADMIN) {
            throw new BadRequestException('Cannot delete admin users');
        }

        // Check for active applications
        if (user.candidate && user.candidate._count.applications > 0) {
            throw new BadRequestException(
                'Cannot delete user with active applications. Please block the user instead.'
            );
        }

        await this.prisma.$transaction(async (tx) => {
            // Delete related data based on role
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
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'User',
                    entityId: userId,
                    metadata: { action: 'delete', email: user.email, role: user.role },
                },
            });
        });

        return { success: true, message: 'User deleted successfully' };
    }

    // ===========================================
    // PAYMENT & REFUND
    // ===========================================

    async getAllPayments(page = 1, limit = 20, status?: PaymentStatus) {
        const where: any = {};
        if (status) where.status = status;

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
            where: { status: RefundStatus.REQUESTED },
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

    async approveRefund(refundId: string, adminId: string, notes?: string) {
        const refund = await this.prisma.refund.findUnique({
            where: { id: refundId },
            include: { payment: true },
        });

        if (!refund) throw new NotFoundException('Refund not found');
        if (refund.status !== RefundStatus.REQUESTED) {
            throw new BadRequestException('Refund already processed');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.refund.update({
                where: { id: refundId },
                data: {
                    status: RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: notes,
                },
            });

            await tx.payment.update({
                where: { id: refund.paymentId },
                data: { status: PaymentStatus.REFUNDED },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: { action: 'approve', notes },
                },
            });
        });

        // TODO: Process actual Razorpay refund

        return { success: true, message: 'Refund approved' };
    }

    async rejectRefund(refundId: string, adminId: string, reason: string) {
        const refund = await this.prisma.refund.findUnique({
            where: { id: refundId },
        });

        if (!refund) throw new NotFoundException('Refund not found');
        if (refund.status !== RefundStatus.REQUESTED) {
            throw new BadRequestException('Refund already processed');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.refund.update({
                where: { id: refundId },
                data: {
                    status: RefundStatus.REJECTED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: reason,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refundId,
                    metadata: { action: 'reject', reason },
                },
            });
        });

        return { success: true, message: 'Refund rejected' };
    }

    // ===========================================
    // AUDIT LOGS
    // ===========================================

    async getAuditLogs(page = 1, limit = 50, action?: AuditAction) {
        const where: any = {};
        if (action) where.action = action;

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
}
