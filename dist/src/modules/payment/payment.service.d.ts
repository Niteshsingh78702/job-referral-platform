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
    })[]>;
    getPaymentById(userId: string, paymentId: string): Promise<{
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
            };
            job: {
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
    }>;
    requestRefund(userId: string, dto: RequestRefundDto): Promise<{
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
    }>;
    private verifySignature;
    private verifyWebhookSignature;
}
