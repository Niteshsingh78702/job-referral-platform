import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentOrderDto, VerifyPaymentDto, RequestRefundDto } from './dto';
export declare class PaymentService {
    private prisma;
    private configService;
    private razorpay;
    constructor(prisma: PrismaService, configService: ConfigService);
    private ensureRazorpay;
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
    private processSuccessfulPayment;
    private processFailedPayment;
    getPaymentHistory(userId: string): Promise<({
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
    })[]>;
    getPaymentById(userId: string, paymentId: string): Promise<{
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
    }>;
    requestRefund(userId: string, dto: RequestRefundDto): Promise<{
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
    }>;
    private verifySignature;
    private verifyWebhookSignature;
}
