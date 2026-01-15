"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const prisma_service_1 = require("../../prisma/prisma.service");
const constants_1 = require("../../common/constants");
let PaymentService = class PaymentService {
    prisma;
    configService;
    razorpay = null;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
        if (keyId && keySecret && keyId !== 'rzp_test_your_key_id') {
            this.razorpay = new razorpay_1.default({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
        else {
            console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
        }
    }
    ensureRazorpay() {
        if (!this.razorpay) {
            throw new common_1.BadRequestException('Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        return this.razorpay;
    }
    async createOrder(userId, dto) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: dto.applicationId },
            include: {
                candidate: true,
                job: true,
                referral: true,
                payments: true,
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (application.status !== constants_1.ApplicationStatus.REFERRAL_CONFIRMED) {
            throw new common_1.BadRequestException('Payment not available. Referral must be confirmed first.');
        }
        if (!application.referral || application.referral.status !== constants_1.ReferralStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Referral not confirmed');
        }
        const successfulPayment = application.payments.find((p) => p.status === constants_1.PaymentStatus.SUCCESS);
        if (successfulPayment) {
            throw new common_1.BadRequestException('Payment already completed');
        }
        const pendingPayment = application.payments.find((p) => p.status === constants_1.PaymentStatus.ORDER_CREATED || p.status === constants_1.PaymentStatus.PENDING);
        if (pendingPayment && pendingPayment.razorpayOrderId) {
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: pendingPayment.amount,
                currency: pendingPayment.currency,
                paymentId: pendingPayment.id,
            };
        }
        const amount = application.job.referralFee * 100;
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
        const payment = await this.prisma.payment.create({
            data: {
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: application.job.referralFee,
                currency: 'INR',
                status: constants_1.PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
            },
        });
        await this.prisma.jobApplication.update({
            where: { id: application.id },
            data: { status: constants_1.ApplicationStatus.PAYMENT_PENDING },
        });
        await this.prisma.referral.update({
            where: { applicationId: application.id },
            data: { status: constants_1.ReferralStatus.PAYMENT_PENDING },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: constants_1.AuditAction.PAYMENT_INITIATED,
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
    async verifyPayment(userId, dto) {
        const isValid = this.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: dto.razorpayOrderId },
            include: {
                application: {
                    include: { candidate: true },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (payment.status === constants_1.PaymentStatus.SUCCESS) {
            return { success: true, message: 'Payment already verified' };
        }
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                razorpayPaymentId: dto.razorpayPaymentId,
                razorpaySignature: dto.razorpaySignature,
                status: constants_1.PaymentStatus.PENDING,
            },
        });
        return { success: true, message: 'Payment verification initiated' };
    }
    async handleWebhook(payload, signature) {
        const isValid = this.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const event = payload.event;
        const paymentData = payload.payload?.payment?.entity;
        if (!paymentData) {
            return { success: true };
        }
        const orderId = paymentData.order_id;
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: orderId },
            include: { application: true },
        });
        if (!payment) {
            return { success: true, message: 'Payment not found' };
        }
        if (payment.status === constants_1.PaymentStatus.SUCCESS || payment.status === constants_1.PaymentStatus.REFUNDED) {
            return { success: true, message: 'Already processed' };
        }
        if (event === 'payment.captured' || event === 'payment.authorized') {
            await this.processSuccessfulPayment(payment, paymentData);
        }
        else if (event === 'payment.failed') {
            await this.processFailedPayment(payment, paymentData);
        }
        return { success: true };
    }
    async processSuccessfulPayment(payment, paymentData) {
        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    razorpayPaymentId: paymentData.id,
                    status: constants_1.PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                    webhookPayload: paymentData,
                },
            });
            const interview = await tx.interview.findUnique({
                where: { applicationId: payment.applicationId },
            });
            if (interview && interview.status === 'PAYMENT_PENDING') {
                await tx.interview.update({
                    where: { id: interview.id },
                    data: {
                        status: 'READY_TO_SCHEDULE',
                        paymentStatus: constants_1.PaymentStatus.SUCCESS,
                        paidAt: new Date(),
                    },
                });
            }
            else {
                await tx.jobApplication.update({
                    where: { id: payment.applicationId },
                    data: {
                        status: constants_1.ApplicationStatus.CONTACT_UNLOCKED,
                        contactUnlockedAt: new Date(),
                    },
                });
                await tx.referral.update({
                    where: { applicationId: payment.applicationId },
                    data: { status: constants_1.ReferralStatus.CONTACTED },
                });
            }
            await tx.auditLog.create({
                data: {
                    action: constants_1.AuditAction.PAYMENT_SUCCESS,
                    entityType: 'Payment',
                    entityId: payment.id,
                    metadata: { razorpayPaymentId: paymentData.id },
                },
            });
        });
    }
    async processFailedPayment(payment, paymentData) {
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: constants_1.PaymentStatus.FAILED,
                failureReason: paymentData.error_description || 'Payment failed',
                webhookPayload: paymentData,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: constants_1.AuditAction.PAYMENT_FAILED,
                entityType: 'Payment',
                entityId: payment.id,
                metadata: { error: paymentData.error_description },
            },
        });
    }
    async getPaymentHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        return this.prisma.payment.findMany({
            where: {
                application: {
                    candidateId: candidate.id,
                },
            },
            include: {
                application: {
                    include: {
                        job: {
                            select: {
                                title: true,
                                companyName: true,
                            },
                        },
                    },
                },
                refund: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPaymentById(userId, paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                refund: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        return payment;
    }
    async requestRefund(userId, dto) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: dto.paymentId },
            include: {
                application: {
                    include: {
                        candidate: true,
                        referral: true,
                    },
                },
                refund: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (payment.status !== constants_1.PaymentStatus.SUCCESS) {
            throw new common_1.BadRequestException('Only successful payments can be refunded');
        }
        if (payment.refund) {
            throw new common_1.BadRequestException('Refund already requested');
        }
        if (payment.application.status === constants_1.ApplicationStatus.CONTACT_UNLOCKED ||
            payment.application.referral?.status === constants_1.ReferralStatus.CONTACTED) {
            throw new common_1.BadRequestException('Refund not available after contact has been shared');
        }
        const refund = await this.prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: payment.amount,
                reason: dto.reason,
                status: constants_1.RefundStatus.REQUESTED,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: constants_1.AuditAction.REFUND_REQUESTED,
                entityType: 'Refund',
                entityId: refund.id,
                metadata: { paymentId: payment.id, reason: dto.reason },
            },
        });
        return refund;
    }
    async createInterviewOrder(userId, applicationId) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                candidate: true,
                job: true,
                interview: true,
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (!application.interview) {
            throw new common_1.BadRequestException('No interview request found for this application');
        }
        if (application.interview.status !== 'PAYMENT_PENDING') {
            throw new common_1.BadRequestException(`Interview is in ${application.interview.status} status. Payment not required.`);
        }
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: constants_1.PaymentStatus.SUCCESS,
                amount: 99,
            },
        });
        if (existingPayment) {
            throw new common_1.BadRequestException('Interview payment already completed');
        }
        const pendingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: { in: [constants_1.PaymentStatus.ORDER_CREATED, constants_1.PaymentStatus.PENDING] },
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
        const amount = 9900;
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
        const payment = await this.prisma.payment.create({
            data: {
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: 99,
                currency: 'INR',
                status: constants_1.PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: constants_1.AuditAction.PAYMENT_INITIATED,
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
    async verifyInterviewPayment(userId, dto) {
        const isValid = this.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: dto.razorpayOrderId },
            include: {
                application: {
                    include: {
                        candidate: { include: { user: true } },
                        interview: true,
                        job: { include: { hr: { include: { user: true } } } },
                    },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.application.candidate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (payment.status === constants_1.PaymentStatus.SUCCESS) {
            return { success: true, message: 'Payment already verified' };
        }
        const interview = payment.application.interview;
        if (!interview) {
            throw new common_1.BadRequestException('Interview not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    razorpayPaymentId: dto.razorpayPaymentId,
                    status: constants_1.PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });
            await tx.interview.update({
                where: { id: interview.id },
                data: {
                    status: 'READY_TO_SCHEDULE',
                    paymentStatus: constants_1.PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: constants_1.AuditAction.PAYMENT_SUCCESS,
                    entityType: 'InterviewPayment',
                    entityId: payment.id,
                    metadata: {
                        razorpayPaymentId: dto.razorpayPaymentId,
                        interviewId: interview.id,
                    },
                },
            });
        });
        return {
            success: true,
            message: 'Interview payment verified. HR will schedule your interview soon.',
        };
    }
    verifySignature(orderId, paymentId, signature) {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET');
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
    verifyWebhookSignature(payload, signature) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        const body = JSON.stringify(payload);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map