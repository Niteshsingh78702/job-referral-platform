import { PaymentService } from './payment.service';
import { CreatePaymentOrderDto, VerifyPaymentDto, RequestRefundDto } from './dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createOrder(userId: string, dto: CreatePaymentOrderDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        keyId?: undefined;
    } | {
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        keyId: any;
    }>;
    verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<{
        success: boolean;
        message: string;
    }>;
    handleWebhook(payload: any, signature: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
    getPaymentHistory(userId: string): Promise<({
        application: {
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
    })[]>;
    getPayment(userId: string, paymentId: string): Promise<{
        application: {
            candidate: {
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
            };
            job: {
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
    }>;
    requestRefund(userId: string, dto: RequestRefundDto): Promise<{
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
    }>;
}
