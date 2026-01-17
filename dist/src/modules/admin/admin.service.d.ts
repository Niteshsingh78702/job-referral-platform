import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus, UserRole, JobStatus, PaymentStatus, AuditAction } from '../../common/constants';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardMetrics(): Promise<{
        users: {
            total: number;
            candidates: number;
            hrs: number;
            employees: number;
        };
        jobs: {
            total: number;
            active: number;
        };
        revenue: {
            totalPayments: number;
            totalAmount: number;
            pendingRefunds: number;
        };
        activity: {
            todayApplications: number;
        };
    }>;
    getAllUsers(page?: number, limit?: number, role?: UserRole, status?: UserStatus): Promise<{
        data: ({
            candidate: {
                firstName: string;
                lastName: string;
            } | null;
            hr: {
                companyName: string;
                approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            } | null;
            employee: {
                companyName: string;
                referralCount: number;
            } | null;
        } & {
            id: string;
            email: string;
            phone: string | null;
            googleId: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerified: boolean;
            phoneVerified: boolean;
            authProvider: string;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    blockUser(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    unblockUser(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingHRApprovals(): Promise<({
        user: {
            email: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        companyEmail: string;
        companyWebsite: string | null;
        designation: string | null;
        linkedinUrl: string | null;
        approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
        totalJobsPosted: number;
        activeJobs: number;
    })[]>;
    approveHR(hrId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectHR(hrId: string, adminId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllJobs(page?: number, limit?: number, status?: JobStatus): Promise<{
        data: ({
            hr: {
                companyName: string;
            } | null;
            _count: {
                applications: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            companyName: string;
            title: string;
            description: string;
            testId: string | null;
            slug: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            location: string;
            isRemote: boolean;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string;
            experienceMin: number | null;
            experienceMax: number | null;
            educationLevel: string | null;
            maxApplications: number;
            applicationCount: number;
            referralFee: number;
            hrId: string | null;
            postedAt: Date | null;
            expiresAt: Date | null;
            skillBucketId: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approveJob(jobId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    expireJob(jobId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createJob(jobData: any, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            companyName: string;
            title: string;
            description: string;
            testId: string | null;
            slug: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            location: string;
            isRemote: boolean;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string;
            experienceMin: number | null;
            experienceMax: number | null;
            educationLevel: string | null;
            maxApplications: number;
            applicationCount: number;
            referralFee: number;
            hrId: string | null;
            postedAt: Date | null;
            expiresAt: Date | null;
            skillBucketId: string | null;
        };
    }>;
    updateJob(jobId: string, jobData: any, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            companyName: string;
            title: string;
            description: string;
            testId: string | null;
            slug: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
            location: string;
            isRemote: boolean;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string;
            experienceMin: number | null;
            experienceMax: number | null;
            educationLevel: string | null;
            maxApplications: number;
            applicationCount: number;
            referralFee: number;
            hrId: string | null;
            postedAt: Date | null;
            expiresAt: Date | null;
            skillBucketId: string | null;
        };
    }>;
    deleteJob(jobId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllCandidates(page?: number, limit?: number, search?: string): Promise<{
        data: ({
            candidate: ({
                applications: ({
                    job: {
                        companyName: string;
                        title: string;
                    };
                } & {
                    id: string;
                    status: import("@prisma/client").$Enums.ApplicationStatus;
                    createdAt: Date;
                    updatedAt: Date;
                    jobId: string;
                    candidateId: string;
                    coverLetter: string | null;
                    testScore: number | null;
                    testPassedAt: Date | null;
                    contactUnlockedAt: Date | null;
                })[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                firstName: string;
                lastName: string;
                headline: string | null;
                bio: string | null;
                avatarUrl: string | null;
                resumeUrl: string | null;
                totalExperience: number | null;
                currentCompany: string | null;
                currentRole: string | null;
                expectedSalary: number | null;
                noticePeriod: number | null;
                city: string | null;
                state: string | null;
                country: string | null;
                willingToRelocate: boolean;
            }) | null;
        } & {
            id: string;
            email: string;
            phone: string | null;
            googleId: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerified: boolean;
            phoneVerified: boolean;
            authProvider: string;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    deleteUser(userId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllPayments(page?: number, limit?: number, status?: PaymentStatus): Promise<{
        data: ({
            refund: {
                id: string;
                status: import("@prisma/client").$Enums.RefundStatus;
                createdAt: Date;
                updatedAt: Date;
                amount: number;
                paymentId: string;
                reason: string;
                adminNotes: string | null;
                processedBy: string | null;
                processedAt: Date | null;
                razorpayRefundId: string | null;
            } | null;
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                };
                job: {
                    companyName: string;
                    title: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                candidateId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            applicationId: string;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            amount: number;
            currency: string;
            failureReason: string | null;
            webhookPayload: import("@prisma/client/runtime/library").JsonValue | null;
            orderCreatedAt: Date | null;
            paidAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPendingRefunds(): Promise<({
        payment: {
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                };
                job: {
                    companyName: string;
                    title: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                candidateId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            applicationId: string;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            amount: number;
            currency: string;
            failureReason: string | null;
            webhookPayload: import("@prisma/client/runtime/library").JsonValue | null;
            orderCreatedAt: Date | null;
            paidAt: Date | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.RefundStatus;
        createdAt: Date;
        updatedAt: Date;
        amount: number;
        paymentId: string;
        reason: string;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
        razorpayRefundId: string | null;
    })[]>;
    approveRefund(refundId: string, adminId: string, notes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectRefund(refundId: string, adminId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAuditLogs(page?: number, limit?: number, action?: AuditAction): Promise<{
        data: ({
            user: {
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: import("@prisma/client").$Enums.AuditAction;
            entityType: string;
            entityId: string;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllInterviews(page?: number, limit?: number, status?: string): Promise<{
        data: ({
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                };
                job: {
                    companyName: string;
                    title: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                candidateId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            updatedAt: Date;
            mode: import("@prisma/client").$Enums.InterviewMode;
            applicationId: string;
            paidAt: Date | null;
            preferredTimeWindow: string | null;
            hrNotes: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            scheduledDate: Date | null;
            scheduledTime: string | null;
            interviewLink: string | null;
            callDetails: string | null;
            requestedAt: Date;
            scheduledAt: Date | null;
            completedAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getInterviewStats(): Promise<{
        total: number;
        byStatus: {
            interviewConfirmed: number;
            paymentSuccess: number;
            completed: number;
            candidateNoShow: number;
            hrNoShow: number;
            cancelled: number;
        };
        noShowRate: string;
        completionRate: string;
    }>;
    updateInterviewStatus(interviewId: string, newStatus: string, adminId: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markInterviewCompleted(interviewId: string, adminId: string, notes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markInterviewNoShow(interviewId: string, adminId: string, noShowType: 'CANDIDATE' | 'HR', notes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllSkillBuckets(includeInactive?: boolean): Promise<({
        test: {
            id: string;
            title: string;
            duration: number;
            totalQuestions: number;
        } | null;
        _count: {
            jobs: number;
            attempts: number;
            jobRequirements: number;
        };
        testTemplate: {
            id: string;
            name: string;
            duration: number;
            passingCriteria: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        testId: string | null;
        experienceMin: number;
        experienceMax: number;
        testTemplateId: string | null;
        code: string;
        displayName: string | null;
    })[]>;
    createSkillBucket(data: {
        code: string;
        name: string;
        description?: string;
        displayName?: string;
        experienceMin?: number;
        experienceMax?: number;
        testId?: string;
        testTemplateId?: string;
    }, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            testId: string | null;
            experienceMin: number;
            experienceMax: number;
            testTemplateId: string | null;
            code: string;
            displayName: string | null;
        };
    }>;
    updateSkillBucket(id: string, data: any, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            testId: string | null;
            experienceMin: number;
            experienceMax: number;
            testTemplateId: string | null;
            code: string;
            displayName: string | null;
        };
    }>;
    deleteSkillBucket(id: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addSkillRequirementToJob(jobId: string, skillBucketId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            skillBucket: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                testId: string | null;
                experienceMin: number;
                experienceMax: number;
                testTemplateId: string | null;
                code: string;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            skillBucketId: string;
            jobId: string;
            displayOrder: number;
        };
    }>;
    removeSkillRequirementFromJob(jobId: string, skillBucketId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getJobSkillRequirements(jobId: string): Promise<{
        jobId: string;
        jobTitle: string;
        legacySkillBucket: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            testId: string | null;
            experienceMin: number;
            experienceMax: number;
            testTemplateId: string | null;
            code: string;
            displayName: string | null;
        } | null;
        compositeRequirements: ({
            skillBucket: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                testId: string | null;
                experienceMin: number;
                experienceMax: number;
                testTemplateId: string | null;
                code: string;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            skillBucketId: string;
            jobId: string;
            displayOrder: number;
        })[];
    }>;
    updatePaymentStatus(paymentId: string, newStatus: PaymentStatus, adminId: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    issueManualRefund(paymentId: string, adminId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getRevenueReport(startDate?: Date, endDate?: Date): Promise<{
        summary: {
            totalRevenue: number;
            totalRefunds: number;
            netRevenue: number;
            transactionCount: number;
        };
        dailyBreakdown: {
            date: string;
            amount: number;
        }[];
    }>;
    getEnhancedAnalytics(): Promise<{
        users: {
            totalCandidates: number;
            totalHRs: number;
            activeUsers: number;
            blockedUsers: number;
        };
        tests: {
            totalAttempts: number;
            passed: number;
            failed: number;
            passRate: string;
        };
        interviews: {
            total: number;
            completed: number;
            scheduled: number;
            completionRate: string;
        };
        payments: {
            total: number;
            successful: number;
            refunded: number;
        };
    }>;
}
