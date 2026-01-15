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
            employee: {
                companyName: string;
                referralCount: number;
            } | null;
            hr: {
                companyName: string;
                approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            } | null;
        } & {
            id: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerified: boolean;
            phoneVerified: boolean;
            googleId: string | null;
            authProvider: string;
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
            createdAt: Date;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        userId: string;
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
            hrId: string | null;
            expiresAt: Date | null;
            slug: string;
            title: string;
            description: string;
            requirements: string | null;
            responsibilities: string | null;
            companyName: string;
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
            testId: string | null;
            postedAt: Date | null;
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
            hrId: string | null;
            expiresAt: Date | null;
            slug: string;
            title: string;
            description: string;
            requirements: string | null;
            responsibilities: string | null;
            companyName: string;
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
            testId: string | null;
            postedAt: Date | null;
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
            hrId: string | null;
            expiresAt: Date | null;
            slug: string;
            title: string;
            description: string;
            requirements: string | null;
            responsibilities: string | null;
            companyName: string;
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
            testId: string | null;
            postedAt: Date | null;
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
                        title: string;
                        companyName: string;
                    };
                } & {
                    id: string;
                    candidateId: string;
                    jobId: string;
                    status: import("@prisma/client").$Enums.ApplicationStatus;
                    coverLetter: string | null;
                    testScore: number | null;
                    testPassedAt: Date | null;
                    contactUnlockedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
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
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerified: boolean;
            phoneVerified: boolean;
            googleId: string | null;
            authProvider: string;
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
            application: {
                candidate: {
                    firstName: string;
                    lastName: string;
                };
                job: {
                    title: string;
                    companyName: string;
                };
            } & {
                id: string;
                candidateId: string;
                jobId: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            refund: {
                id: string;
                status: import("@prisma/client").$Enums.RefundStatus;
                createdAt: Date;
                updatedAt: Date;
                amount: number;
                paymentId: string;
                reason: string;
                processedBy: string | null;
                processedAt: Date | null;
                adminNotes: string | null;
                razorpayRefundId: string | null;
            } | null;
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
                    title: string;
                    companyName: string;
                };
            } & {
                id: string;
                candidateId: string;
                jobId: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
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
        processedBy: string | null;
        processedAt: Date | null;
        adminNotes: string | null;
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
}
