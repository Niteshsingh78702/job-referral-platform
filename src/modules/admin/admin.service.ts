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
                    Candidate: { select: { firstName: true, lastName: true } },
                    HR: { select: { companyName: true, approvalStatus: true } },
                    Employee: { select: { companyName: true, referralCount: true } },
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
                User: { select: { email: true, createdAt: true } },
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
                    HR: { select: { companyName: true } },
                    _count: { select: { JobApplication: true } },
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
            include: { _count: { select: { JobApplication: true } } },
        });

        if (!job) throw new NotFoundException('Job not found');

        // Check if there are applications
        if (job._count.JobApplication > 0) {
            throw new BadRequestException(
                `Cannot delete job with ${job._count.JobApplication} applications. Please expire the job instead.`
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
                { Candidate: { firstName: { contains: search, mode: 'insensitive' } } },
                { Candidate: { lastName: { contains: search, mode: 'insensitive' } } },
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
                                    Job: { select: { title: true, companyName: true } },
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
                Candidate: { include: { _count: { select: { JobApplication: true } } } },
                HR: true,
                Employee: true,
            },
        });

        if (!user) throw new NotFoundException('User not found');
        if (user.role === UserRole.ADMIN) {
            throw new BadRequestException('Cannot delete admin users');
        }

        // Check for active applications
        if (user.Candidate && user.Candidate._count.JobApplication > 0) {
            throw new BadRequestException(
                'Cannot delete user with active applications. Please block the user instead.'
            );
        }

        await this.prisma.$transaction(async (tx) => {
            // Delete related data based on role
            if (user.Candidate) {
                await tx.candidate.delete({ where: { userId } });
            }
            if (user.HR) {
                await tx.hR.delete({ where: { userId } });
            }
            if (user.Employee) {
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
                    JobApplication: {
                        include: {
                            Candidate: { select: { firstName: true, lastName: true } },
                            Job: { select: { title: true, companyName: true } },
                        },
                    },
                    Refund: true,
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
                Payment: {
                    include: {
                        JobApplication: {
                            include: {
                                Candidate: { select: { firstName: true, lastName: true } },
                                Job: { select: { title: true, companyName: true } },
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
            include: { Payment: true },
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
                    User: { select: { email: true } },
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

    // ===========================================
    // INTERVIEW MANAGEMENT
    // ===========================================

    async getAllInterviews(page = 1, limit = 20, status?: string) {
        const where: any = {};
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
                            Candidate: { select: { firstName: true, lastName: true } },
                            Job: { select: { title: true, companyName: true } },
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
        const [
            total,
            interviewConfirmed,
            paymentSuccess,
            completed,
            candidateNoShow,
            hrNoShow,
            cancelled,
        ] = await Promise.all([
            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_CONFIRMED' } }),
            this.prisma.interview.count({ where: { status: 'PAYMENT_SUCCESS' } }),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_COMPLETED' } }),
            this.prisma.interview.count({ where: { status: 'CANDIDATE_NO_SHOW' } }),
            this.prisma.interview.count({ where: { status: 'HR_NO_SHOW' } }),
            this.prisma.interview.count({ where: { status: 'CANCELLED' } }),
        ]);

        // Calculate no-show rate
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

    async updateInterviewStatus(
        interviewId: string,
        newStatus: string,
        adminId: string,
        reason?: string,
    ) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) throw new NotFoundException('Interview not found');

        const oldStatus = interview.status;

        await this.prisma.$transaction(async (tx) => {
            const updateData: any = { status: newStatus };

            // Set appropriate timestamps based on new status
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
                    action: AuditAction.ADMIN_OVERRIDE,
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

    async markInterviewCompleted(interviewId: string, adminId: string, notes?: string) {
        return this.updateInterviewStatus(interviewId, 'INTERVIEW_COMPLETED', adminId, notes);
    }

    async markInterviewNoShow(
        interviewId: string,
        adminId: string,
        noShowType: 'CANDIDATE' | 'HR',
        notes?: string,
    ) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        Candidate: { select: { userId: true } },
                        Job: { include: { HR: { select: { userId: true } } } },
                    },
                },
            },
        });

        if (!interview) throw new NotFoundException('Interview not found');

        await this.prisma.$transaction(async (tx) => {
            // Mark interview with appropriate no-show status
            const noShowStatus = noShowType === 'CANDIDATE' ? 'CANDIDATE_NO_SHOW' : 'HR_NO_SHOW';
            await tx.interview.update({
                where: { id: interviewId },
                data: { status: noShowStatus },
            });

            // Log the no-show with details
            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
                    entityType: 'Interview',
                    entityId: interviewId,
                    metadata: {
                        action: 'no_show',
                        noShowType,
                        notes,
                        candidateId: interview.application?.candidateId || null,
                        jobId: interview.application?.jobId || null,
                    },
                },
            });
        });

        return {
            success: true,
            message: `Interview marked as no-show (${noShowType})`,
        };
    }

    // ===========================================
    // SKILL BUCKET MANAGEMENT
    // ===========================================

    async getAllSkillBuckets(includeInactive = false) {
        return this.prisma.skillBucket.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                Test: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        totalQuestionBank: true,
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

    async createSkillBucket(data: {
        code: string;
        name: string;
        description?: string;
        displayName?: string;
        experienceMin?: number;
        experienceMax?: number;
        testId?: string;
        testTemplateId?: string;
    }, adminId: string) {
        // Check if code already exists
        const existing = await this.prisma.skillBucket.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            throw new BadRequestException(`Skill bucket with code '${data.code}' already exists`);
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
                action: AuditAction.CREATE,
                entityType: 'SkillBucket',
                entityId: skillBucket.id,
                newValue: data as any,
            },
        });

        return { success: true, message: 'Skill bucket created', data: skillBucket };
    }

    async updateSkillBucket(id: string, data: any, adminId: string) {
        const existing = await this.prisma.skillBucket.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Skill bucket not found');

        const updated = await this.prisma.skillBucket.update({
            where: { id },
            data,
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.UPDATE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: existing as any,
                newValue: data,
            },
        });

        return { success: true, message: 'Skill bucket updated', data: updated };
    }

    async deleteSkillBucket(id: string, adminId: string) {
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

        if (!bucket) throw new NotFoundException('Skill bucket not found');

        // Check if skill bucket is in use
        if (bucket._count.jobs > 0 || bucket._count.jobRequirements > 0) {
            throw new BadRequestException(
                `Cannot delete skill bucket: it is assigned to ${bucket._count.jobs + bucket._count.jobRequirements} job(s). Deactivate it instead.`
            );
        }

        // If there are attempts, just deactivate instead of hard delete
        if (bucket._count.attempts > 0) {
            await this.prisma.skillBucket.update({
                where: { id },
                data: { isActive: false },
            });

            await this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.UPDATE,
                    entityType: 'SkillBucket',
                    entityId: id,
                    metadata: { action: 'deactivate', reason: 'has_attempts' },
                },
            });

            return { success: true, message: 'Skill bucket deactivated (has test attempts)' };
        }

        // Safe to hard delete
        await this.prisma.skillBucket.delete({ where: { id } });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.DELETE,
                entityType: 'SkillBucket',
                entityId: id,
                oldValue: bucket as any,
            },
        });

        return { success: true, message: 'Skill bucket deleted' };
    }

    // ===========================================
    // JOB SKILL REQUIREMENTS
    // ===========================================

    async addSkillRequirementToJob(jobId: string, skillBucketId: string, adminId: string) {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Job not found');

        const bucket = await this.prisma.skillBucket.findUnique({ where: { id: skillBucketId } });
        if (!bucket) throw new NotFoundException('Skill bucket not found');

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
                SkillBucket: true,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.CREATE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: { jobId, skillBucketId, skillBucketCode: bucket.code },
            },
        });

        return { success: true, message: 'Skill requirement added to job', data: requirement };
    }

    async removeSkillRequirementFromJob(jobId: string, skillBucketId: string, adminId: string) {
        const requirement = await this.prisma.jobRequiredSkillBucket.findUnique({
            where: {
                jobId_skillBucketId: { jobId, skillBucketId },
            },
        });

        if (!requirement) throw new NotFoundException('Skill requirement not found for this job');

        await this.prisma.jobRequiredSkillBucket.delete({
            where: {
                jobId_skillBucketId: { jobId, skillBucketId },
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.DELETE,
                entityType: 'JobRequiredSkillBucket',
                entityId: requirement.id,
                metadata: { jobId, skillBucketId },
            },
        });

        return { success: true, message: 'Skill requirement removed from job' };
    }

    async getJobSkillRequirements(jobId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                SkillBucket: true, // Legacy single bucket
                requiredSkillBucket: {
                    include: {
                        SkillBucket: true,
                    },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });

        if (!job) throw new NotFoundException('Job not found');

        return {
            jobId: job.id,
            jobTitle: job.title,
            legacySkillBucket: job.SkillBucket,
            compositeRequirements: job.requiredSkillBuckets,
        };
    }

    // ===========================================
    // PAYMENT CONTROL (ADMIN OVERRIDE)
    // ===========================================

    async updatePaymentStatus(paymentId: string, newStatus: PaymentStatus, adminId: string, reason?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) throw new NotFoundException('Payment not found');

        const oldStatus = payment.status;

        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: newStatus,
                    ...(newStatus === PaymentStatus.SUCCESS && { paidAt: new Date() }),
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.ADMIN_OVERRIDE,
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

    async issueManualRefund(paymentId: string, adminId: string, reason: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { Refund: true },
        });

        if (!payment) throw new NotFoundException('Payment not found');
        if (payment.status !== PaymentStatus.SUCCESS) {
            throw new BadRequestException('Can only refund successful payments');
        }
        if (payment.Refund) {
            throw new BadRequestException('Payment already has a refund request');
        }

        await this.prisma.$transaction(async (tx) => {
            // Create refund record
            const refund = await tx.refund.create({
                data: {
                    paymentId,
                    amount: payment.amount,
                    reason: `ADMIN Refund: ${reason}`,
                    status: RefundStatus.APPROVED,
                    processedBy: adminId,
                    processedAt: new Date(),
                    adminNotes: 'Manual refund by admin',
                },
            });

            // Update payment status
            await tx.payment.update({
                where: { id: paymentId },
                data: { status: PaymentStatus.REFUNDED },
            });

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: AuditAction.REFUND_PROCESSED,
                    entityType: 'Refund',
                    entityId: refund.id,
                    metadata: { action: 'manual_refund', reason, amount: payment.amount },
                },
            });
        });

        // TODO: Process actual Razorpay refund

        return { success: true, message: 'Manual refund issued successfully' };
    }

    // ===========================================
    // REVENUE REPORTS
    // ===========================================

    async getRevenueReport(startDate?: Date, endDate?: Date) {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = startDate;
        if (endDate) dateFilter.lte = endDate;

        const payments = await this.prisma.payment.findMany({
            where: {
                status: PaymentStatus.SUCCESS,
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
                status: RefundStatus.APPROVED,
                ...(Object.keys(dateFilter).length > 0 && { processedAt: dateFilter }),
            },
            _sum: { amount: true },
        });

        const netRevenue = totalRevenue - (refunds._sum.amount || 0);

        // Group by date for charting
        const dailyRevenue: Record<string, number> = {};
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

    // ===========================================
    // ENHANCED ANALYTICS
    // ===========================================

    async getEnhancedAnalytics() {
        const [
            // User metrics
            totalCandidates,
            totalHRs,
            activeUsers,
            blockedUsers,

            // Test metrics
            totalTestAttempts,
            passedTests,
            failedTests,

            // Interview metrics
            totalInterviews,
            completedInterviews,
            scheduledInterviews,

            // Payment metrics
            totalPayments,
            successfulPayments,
            refundedPayments,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: UserRole.CANDIDATE } }),
            this.prisma.user.count({ where: { role: UserRole.HR } }),
            this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
            this.prisma.user.count({ where: { status: UserStatus.BLOCKED } }),

            this.prisma.skillTestAttempt.count(),
            this.prisma.skillTestAttempt.count({ where: { isPassed: true } }),
            this.prisma.skillTestAttempt.count({ where: { isPassed: false } }),

            this.prisma.interview.count(),
            this.prisma.interview.count({ where: { status: 'INTERVIEW_COMPLETED' } }),
            this.prisma.interview.count({ where: { status: 'PAYMENT_SUCCESS' } }),

            this.prisma.payment.count(),
            this.prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
            this.prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
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
            Payment: {
                total: totalPayments,
                successful: successfulPayments,
                refunded: refundedPayments,
            },
        };
    }

    // ===========================================
    // TEST OVERRIDE CONTROLS (ADMIN POWER FEATURES)
    // ===========================================

    /**
     * Admin manually marks a candidate as PASSED for a skill test
     * Creates a SkillTestAttempt with isPassed: true
     */
    async manuallyPassTest(
        candidateId: string,
        skillBucketId: string,
        adminId: string,
        reason: string,
        validityDays: number = 7,
    ) {
        // Verify candidate exists
        const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) throw new NotFoundException('Candidate not found');

        // Verify skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({ where: { id: skillBucketId } });
        if (!skillBucket) throw new NotFoundException('Skill bucket not found');

        const now = new Date();
        const validTill = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                candidateId,
                skillBucketId,
                isPassed: true,
                score: 100, // Admin-granted pass
                validTill,
                retestAllowedAt: null,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attempt.id,
                newValue: { isPassed: true, validTill, validityDays, reason },
                metadata: { action: 'manual_pass', candidateId, skillBucketId },
            },
        });

        return {
            success: true,
            message: `Candidate manually passed for ${skillBucket.name}. Valid until ${validTill.toISOString()}`,
            attempt,
        };
    }

    /**
     * Admin manually marks a candidate as FAILED for a skill test
     * Creates a SkillTestAttempt with isPassed: false and immediate retest allowed
     */
    async manuallyFailTest(
        candidateId: string,
        skillBucketId: string,
        adminId: string,
        reason: string,
    ) {
        // Verify candidate exists
        const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) throw new NotFoundException('Candidate not found');

        // Verify skill bucket exists
        const skillBucket = await this.prisma.skillBucket.findUnique({ where: { id: skillBucketId } });
        if (!skillBucket) throw new NotFoundException('Skill bucket not found');

        const now = new Date();

        const attempt = await this.prisma.skillTestAttempt.create({
            data: {
                candidateId,
                skillBucketId,
                isPassed: false,
                score: 0, // Admin-forced fail
                validTill: null,
                retestAllowedAt: now, // Immediate retest allowed since admin forced it
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attempt.id,
                newValue: { isPassed: false, reason },
                metadata: { action: 'manual_fail', candidateId, skillBucketId },
            },
        });

        return {
            success: true,
            message: `Candidate manually failed for ${skillBucket.name}. Immediate retest allowed.`,
            attempt,
        };
    }

    /**
     * Admin extends the validity of an existing test attempt
     */
    async extendTestValidity(
        attemptId: string,
        newValidTill: Date,
        adminId: string,
        reason: string,
    ) {
        const attempt = await this.prisma.skillTestAttempt.findUnique({
            where: { id: attemptId },
            include: { SkillBucket: true },
        });

        if (!attempt) throw new NotFoundException('Test attempt not found');
        if (!attempt.isPassed) throw new BadRequestException('Can only extend validity for passed tests');

        const oldValidTill = attempt.validTill;

        const updated = await this.prisma.skillTestAttempt.update({
            where: { id: attemptId },
            data: { validTill: newValidTill },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attemptId,
                oldValue: { validTill: oldValidTill },
                newValue: { validTill: newValidTill, reason },
                metadata: { action: 'extend_validity' },
            },
        });

        return {
            success: true,
            message: `Validity extended to ${newValidTill.toISOString()}`,
            attempt: updated,
        };
    }

    /**
     * Admin resets the retest cooldown for a failed test attempt
     * Allows candidate to immediately retake the test
     */
    async resetRetestCooldown(
        attemptId: string,
        adminId: string,
        reason: string,
    ) {
        const attempt = await this.prisma.skillTestAttempt.findUnique({
            where: { id: attemptId },
            include: { SkillBucket: true },
        });

        if (!attempt) throw new NotFoundException('Test attempt not found');
        if (attempt.isPassed) throw new BadRequestException('Cooldown reset only applies to failed tests');

        const now = new Date();
        const oldRetestAllowedAt = attempt.retestAllowedAt;

        const updated = await this.prisma.skillTestAttempt.update({
            where: { id: attemptId },
            data: { retestAllowedAt: now },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: AuditAction.ADMIN_OVERRIDE,
                entityType: 'SkillTestAttempt',
                entityId: attemptId,
                oldValue: { retestAllowedAt: oldRetestAllowedAt },
                newValue: { retestAllowedAt: now, reason },
                metadata: { action: 'reset_cooldown' },
            },
        });

        return {
            success: true,
            message: 'Retest cooldown reset. Candidate can now retake the test.',
            attempt: updated,
        };
    }
}


