import { AdminService } from './admin.service';
import { UserRole, UserStatus, JobStatus, PaymentStatus, AuditAction } from '../../common/constants';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
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
    getUsers(page?: number, limit?: number, role?: UserRole, status?: UserStatus): Promise<{
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
            createdAt: Date;
            email: string;
            phone: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerified: boolean;
            phoneVerified: boolean;
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
    getPendingHRs(): Promise<({
        user: {
            createdAt: Date;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        companyName: string;
        companyEmail: string;
        designation: string | null;
        linkedinUrl: string | null;
        companyWebsite: string | null;
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
    getJobs(page?: number, limit?: number, status?: JobStatus): Promise<{
        data: ({
            hr: {
                companyName: string;
            } | null;
            _count: {
                applications: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            updatedAt: Date;
            expiresAt: Date | null;
            companyName: string;
            location: string;
            description: string;
            slug: string;
            title: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
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
            hrId: string | null;
            postedAt: Date | null;
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
            createdAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            updatedAt: Date;
            expiresAt: Date | null;
            companyName: string;
            location: string;
            description: string;
            slug: string;
            title: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
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
            hrId: string | null;
            postedAt: Date | null;
        };
    }>;
    updateJob(jobId: string, jobData: any, adminId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            updatedAt: Date;
            expiresAt: Date | null;
            companyName: string;
            location: string;
            description: string;
            slug: string;
            title: string;
            requirements: string | null;
            responsibilities: string | null;
            companyLogo: string | null;
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
            hrId: string | null;
            postedAt: Date | null;
        };
    }>;
    deleteJob(jobId: string, adminId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCandidates(page?: number, limit?: number, search?: string): Promise<{
        data: ({
            candidate: ({
                applications: ({
                    job: {
                        companyName: string;
                        title: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    status: import("@prisma/client").$Enums.ApplicationStatus;
                    updatedAt: Date;
                    candidateId: string;
                    jobId: string;
                    coverLetter: string | null;
                    testScore: number | null;
                    testPassedAt: Date | null;
                    contactUnlockedAt: Date | null;
                })[];
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
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
            createdAt: Date;
            email: string;
            phone: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerified: boolean;
            phoneVerified: boolean;
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
    getPayments(page?: number, limit?: number, status?: PaymentStatus): Promise<{
        data: ({
            refund: {
                id: string;
                createdAt: Date;
                status: import("@prisma/client").$Enums.RefundStatus;
                updatedAt: Date;
                amount: number;
                paymentId: string;
                reason: string;
                processedBy: string | null;
                processedAt: Date | null;
                adminNotes: string | null;
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
                createdAt: Date;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                updatedAt: Date;
                candidateId: string;
                jobId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            updatedAt: Date;
            applicationId: string;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            amount: number;
            currency: string;
            failureReason: string | null;
            webhookPayload: import("@prisma/client/runtime/client").JsonValue | null;
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
                createdAt: Date;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                updatedAt: Date;
                candidateId: string;
                jobId: string;
                coverLetter: string | null;
                testScore: number | null;
                testPassedAt: Date | null;
                contactUnlockedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            updatedAt: Date;
            applicationId: string;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            amount: number;
            currency: string;
            failureReason: string | null;
            webhookPayload: import("@prisma/client/runtime/client").JsonValue | null;
            orderCreatedAt: Date | null;
            paidAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.RefundStatus;
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
            action: import("@prisma/client").$Enums.AuditAction;
            entityType: string;
            entityId: string;
            oldValue: import("@prisma/client/runtime/client").JsonValue | null;
            newValue: import("@prisma/client/runtime/client").JsonValue | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            createdAt: Date;
            userId: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
