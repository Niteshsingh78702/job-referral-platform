import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreatePaymentOrderDto,
    VerifyPaymentDto,
    RequestRefundDto,
    ProcessRefundDto,
} from './dto';
import {
    PaymentStatus,
    RefundStatus,
    ApplicationStatus,
    ReferralStatus,
    AuditAction,
} from '../../common/constants';

@Injectable()
export class PaymentService {
    private razorpay: Razorpay | null = null;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');

        if (keyId && keySecret && keyId !== 'rzp_test_your_key_id') {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        } else {
            console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
        }
    }

    private ensureRazorpay(): Razorpay {
        if (!this.razorpay) {
            throw new BadRequestException('Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        return this.razorpay;
    }

    // Create payment order
    async createOrder(userId: string, dto: CreatePaymentOrderDto) {
        // Get application
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: dto.applicationId },
            include: {
                Candidate: true,
                Job: true,
                Referral: true,
                Payment: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        // Verify eligibility - now uses INTERVIEW_CONFIRMED for interview payments
        // or APPLIED for old referral payments
        if (application.status !== ApplicationStatus.APPLIED &&
            application.status !== ApplicationStatus.INTERVIEW_CONFIRMED) {
            throw new BadRequestException(
                'Payment not available for this application status.',
            );
        }

        if (!application.Referral || application.referral.status !== ReferralStatus.CONFIRMED) {
            throw new BadRequestException('Referral not confirmed');
        }

        // Check if already paid
        const successfulPayment = application.payments.find(
            (p) => p.status === PaymentStatus.SUCCESS,
        );

        if (successfulPayment) {
            throw new BadRequestException('Payment already completed');
        }

        // Check for pending payment
        const pendingPayment = application.payments.find(
            (p) => p.status === PaymentStatus.ORDER_CREATED || p.status === PaymentStatus.PENDING,
        );

        if (pendingPayment && pendingPayment.razorpayOrderId) {
            // Return existing order
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: pendingPayment.amount,
                currency: pendingPayment.currency,
                paymentId: pendingPayment.id,
            };
        }

        const amount = application.job.referralFee * 100; // Razorpay expects paise

        // Create Razorpay order
        const razorpay = this.ensureRazorpay();
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `app_${application.id.slice(0, 20)}`,
            notes: {
                applicationId: application.id,
                candidateId: application.candidateId,
                jobId: application.jobId,
            },
        });

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: application.job.referralFee,
                currency: 'INR',
                status: PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
            },
        });

        // Update application status
        await this.prisma.jobApplication.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAYMENT_PENDING },
        });

        // Update referral status
        await this.prisma.referral.update({
            where: { applicationId: application.id },
            data: { status: ReferralStatus.PAYMENT_PENDING },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                action: AuditAction.PAYMENT_INITIATED,
                entityType: 'Payment',
                entityId: payment.id,
                metadata: { orderId: order.id, amount: application.job.referralFee },
            },
        });

        return {
            orderId: order.id,
            amount: application.job.referralFee,
            currency: 'INR',
            paymentId: payment.id,
            keyId: this.configService.get('RAZORPAY_KEY_ID'),
        };
    }

    // Verify payment (client-side callback)
    async verifyPayment(userId: string, dto: VerifyPaymentDto) {
        // Verify signature
        const isValid = this.verifySignature(
            dto.razorpayOrderId,
            dto.razorpayPaymentId,
            dto.razorpaySignature,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Get payment
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: dto.razorpayOrderId },
            include: {
                JobApplication: {
                    include: { Candidate: true },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (payment.status === PaymentStatus.SUCCESS) {
            return { success: true, message: 'Payment already verified' };
        }

        // Update payment
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                razorpayPaymentId: dto.razorpayPaymentId,
                razorpaySignature: dto.razorpaySignature,
                status: PaymentStatus.PENDING,
            },
        });

        return { success: true, message: 'Payment verification initiated' };
    }

    // Webhook handler (source of truth)
    async handleWebhook(payload: any, signature: string) {
        // Verify webhook signature
        const isValid = this.verifyWebhookSignature(payload, signature);

        if (!isValid) {
            throw new BadRequestException('Invalid webhook signature');
        }

        const event = payload.event;
        const paymentData = payload.payload?.Payment?.entity;

        if (!paymentData) {
            return { success: true };
        }

        const orderId = paymentData.order_id;

        // Idempotency check
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: orderId },
            include: { application: true },
        });

        if (!payment) {
            return { success: true, message: 'Payment not found' };
        }

        // Already processed
        if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.REFUNDED) {
            return { success: true, message: 'Already processed' };
        }

        if (event === 'payment.captured' || event === 'payment.authorized') {
            await this.processSuccessfulPayment(payment, paymentData);
        } else if (event === 'payment.failed') {
            await this.processFailedPayment(payment, paymentData);
        }

        return { success: true };
    }

    private async processSuccessfulPayment(Payment: any, paymentData: any) {
        await this.prisma.$transaction(async (tx) => {
            // Update payment
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    razorpayPaymentId: paymentData.id,
                    status: PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                    webhookPayload: paymentData,
                },
            });

            // Check if this payment is for an interview
            const interview = await tx.interview.findUnique({
                where: { applicationId: payment.applicationId },
            });

            if (interview && interview.status === 'INTERVIEW_CONFIRMED') {
                // This is an interview payment - update interview status
                await tx.interview.update({
                    where: { id: interview.id },
                    data: {
                        status: 'PAYMENT_SUCCESS' as any,
                        paymentStatus: PaymentStatus.SUCCESS as any,
                        paidAt: new Date(),
                    },
                });

                // Note: Interview payment confirmation email will be sent separately
            } else {
                // This is a referral/legacy payment - update to PAYMENT_SUCCESS
                await tx.jobApplication.update({
                    where: { id: payment.applicationId },
                    data: {
                        status: ApplicationStatus.PAYMENT_SUCCESS as any,
                        contactUnlockedAt: new Date(),
                    },
                });

                // Update referral
                await tx.referral.update({
                    where: { applicationId: payment.applicationId },
                    data: { status: ReferralStatus.CONTACTED },
                });
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    id: crypto.randomUUID(),
                    action: AuditAction.PAYMENT_SUCCESS,
                    entityType: 'Payment',
                    entityId: payment.id,
                    metadata: { razorpayPaymentId: paymentData.id },
                },
            });
        });
    }

    private async processFailedPayment(Payment: any, paymentData: any) {
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: paymentData.error_description || 'Payment failed',
                webhookPayload: paymentData,
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: AuditAction.PAYMENT_FAILED,
                entityType: 'Payment',
                entityId: payment.id,
                metadata: { error: paymentData.error_description },
            },
        });
    }

    // Get payment history
    async getPaymentHistory(userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found');
        }

        return this.prisma.payment.findMany({
            where: {
                JobApplication: {
                    candidateId: candidate.id,
                },
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
                Refund: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get payment by ID
    async getPaymentById(userId: string, paymentId: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true,
                        Job: true,
                    },
                },
                Refund: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        return payment;
    }

    // Request refund
    async requestRefund(userId: string, dto: RequestRefundDto) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: dto.paymentId },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true,
                        Referral: true,
                    },
                },
                Refund: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (payment.status !== PaymentStatus.SUCCESS) {
            throw new BadRequestException('Only successful payments can be refunded');
        }

        if (payment.Refund) {
            throw new BadRequestException('Refund already requested');
        }

        // Check if interview details were already unlocked
        if (
            payment.application.status === ApplicationStatus.PAYMENT_SUCCESS ||
            payment.application.Referral?.status === ReferralStatus.CONTACTED
        ) {
            throw new BadRequestException(
                'Refund not available after details have been shared',
            );
        }

        // Create refund request
        const refund = await this.prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: payment.amount,
                reason: dto.reason,
                status: RefundStatus.REQUESTED,
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                action: AuditAction.REFUND_REQUESTED,
                entityType: 'Refund',
                entityId: refund.id,
                metadata: { paymentId: payment.id, reason: dto.reason },
            },
        });

        return refund;
    }

    // =============================================
    // INTERVIEW PAYMENT METHODS (₹99)
    // =============================================

    /**
     * Create payment order for interview (₹99)
     */
    async createInterviewOrder(userId: string, applicationId: string) {
        // Get application with interview
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                Candidate: true,
                Job: true,
                Interview: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        // Verify interview exists and is pending payment
        if (!application.Interview) {
            throw new BadRequestException('No interview request found for this application');
        }

        // Allow payment when interview is INTERVIEW_CONFIRMED (HR confirmed, awaiting payment)
        // or PAYMENT_PENDING (legacy flow)
        const allowedStatuses = ['INTERVIEW_CONFIRMED', 'PAYMENT_PENDING'];
        if (!allowedStatuses.includes(application.interview.status)) {
            throw new BadRequestException(
                `Interview is in ${application.interview.status} status. Payment not available.`,
            );
        }

        // Check for existing successful payment for this interview
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: PaymentStatus.SUCCESS,
                amount: 99, // Interview fee
            },
        });

        if (existingPayment) {
            throw new BadRequestException('Interview payment already completed');
        }

        // Check for pending order
        const pendingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: { in: [PaymentStatus.ORDER_CREATED, PaymentStatus.PENDING] },
                amount: 99,
            },
        });

        if (pendingPayment && pendingPayment.razorpayOrderId) {
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: 99,
                currency: 'INR',
                paymentId: pendingPayment.id,
                keyId: this.configService.get('RAZORPAY_KEY_ID'),
            };
        }

        const amount = 9900; // ₹99 in paise

        // Create Razorpay order
        const razorpay = this.ensureRazorpay();
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `int_${application.id.slice(0, 18)}`,
            notes: {
                applicationId: application.id,
                interviewId: application.interview.id,
                candidateId: application.candidateId,
                type: 'INTERVIEW',
            },
        });

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: 99,
                currency: 'INR',
                status: PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                action: AuditAction.PAYMENT_INITIATED,
                entityType: 'InterviewPayment',
                entityId: payment.id,
                metadata: { orderId: order.id, amount: 99, interviewId: application.interview.id },
            },
        });

        return {
            orderId: order.id,
            amount: 99,
            currency: 'INR',
            paymentId: payment.id,
            keyId: this.configService.get('RAZORPAY_KEY_ID'),
        };
    }

    /**
     * Verify interview payment and update interview status
     */
    async verifyInterviewPayment(userId: string, dto: VerifyPaymentDto) {
        // Verify signature
        const isValid = this.verifySignature(
            dto.razorpayOrderId,
            dto.razorpayPaymentId,
            dto.razorpaySignature,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Get payment
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: dto.razorpayOrderId },
            include: {
                JobApplication: {
                    include: {
                        Candidate: { include: { User: true } },
                        Interview: true,
                        Job: { include: { HR: { include: { User: true } } } },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.application.candidate.userId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (payment.status === PaymentStatus.SUCCESS) {
            return { success: true, message: 'Payment already verified' };
        }

        const interview = payment.application.Interview;
        if (!interview) {
            throw new BadRequestException('Interview not found');
        }

        // Update payment and interview in transaction
        await this.prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    razorpayPaymentId: dto.razorpayPaymentId,
                    status: PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });

            // Update interview status to PAYMENT_SUCCESS
            await tx.interview.update({
                where: { id: interview.id },
                data: {
                    status: 'PAYMENT_SUCCESS' as any,
                    paymentStatus: PaymentStatus.SUCCESS as any,
                    paidAt: new Date(),
                },
            });

            // CRITICAL: Also update application status to PAYMENT_SUCCESS
            await tx.jobApplication.update({
                where: { id: payment.applicationId },
                data: {
                    status: ApplicationStatus.PAYMENT_SUCCESS as any,
                    contactUnlockedAt: new Date(),
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    id: crypto.randomUUID(),
                    userId,
                    action: AuditAction.PAYMENT_SUCCESS,
                    entityType: 'InterviewPayment',
                    entityId: payment.id,
                    metadata: {
                        razorpayPaymentId: dto.razorpayPaymentId,
                        interviewId: interview.id,
                    },
                },
            });
        });

        // TODO: Send email notification to HR that payment is complete
        // this.emailService.sendInterviewPaymentConfirmation(...)

        return {
            success: true,
            message: 'Interview payment verified. HR will schedule your interview soon.',
        };
    }

    // Signature verification helpers
    private verifySignature(
        orderId: string,
        paymentId: string,
        signature: string,
    ): boolean {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET');
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }

    private verifyWebhookSignature(payload: any, signature: string): boolean {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        const body = JSON.stringify(payload);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
}


