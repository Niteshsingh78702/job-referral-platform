import { PaymentService } from './payment.service';
import { CreatePaymentOrderDto, VerifyPaymentDto, RequestRefundDto } from './dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createOrder(userId: string, dto: CreatePaymentOrderDto): Promise<{
        orderId: any;
        amount: any;
        currency: any;
        paymentId: any;
        keyId?: undefined;
    } | {
        orderId: string;
        amount: any;
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
    getPaymentHistory(userId: string): Promise<{
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
    }[]>;
    getPayment(userId: string, paymentId: string): Promise<{
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
    createInterviewOrder(userId: string, dto: {
        applicationId: string;
    }): Promise<{
        success: boolean;
        data: {
            orderId: string;
            amount: number;
            currency: string;
            paymentId: string;
            keyId: any;
        };
    }>;
    verifyInterviewPayment(userId: string, dto: VerifyPaymentDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
        };
    }>;
}
