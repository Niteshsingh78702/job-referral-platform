"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentService", {
    enumerable: true,
    get: function() {
        return PaymentService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _razorpay = /*#__PURE__*/ _interop_require_default(require("razorpay"));
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../../common/constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PaymentService = class PaymentService {
    ensureRazorpay() {
        if (!this.razorpay) {
            throw new _common.BadRequestException('Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        return this.razorpay;
    }
    // Create payment order
    async createOrder(userId, dto) {
        // Get application
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: dto.applicationId
            },
            include: {
                Candidate: true,
                Job: true,
                Referral: true,
                Payment: true
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        if (application.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        // Verify eligibility - now uses INTERVIEW_CONFIRMED for interview payments
        // or APPLIED for old referral payments
        if (application.status !== _constants.ApplicationStatus.APPLIED && application.status !== _constants.ApplicationStatus.INTERVIEW_CONFIRMED) {
            throw new _common.BadRequestException('Payment not available for this application status.');
        }
        if (!application.Referral || application.Referral.status !== _constants.ReferralStatus.CONFIRMED) {
            throw new _common.BadRequestException('Referral not confirmed');
        }
        // Check if already paid
        const successfulPayment = application.Payment.find((p)=>p.status === _constants.PaymentStatus.SUCCESS);
        if (successfulPayment) {
            throw new _common.BadRequestException('Payment already completed');
        }
        // Check for pending payment
        const pendingPayment = application.Payment.find((p)=>p.status === _constants.PaymentStatus.ORDER_CREATED || p.status === _constants.PaymentStatus.PENDING);
        if (pendingPayment && pendingPayment.razorpayOrderId) {
            // Return existing order
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: pendingPayment.amount,
                currency: pendingPayment.currency,
                paymentId: pendingPayment.id
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
                jobId: application.jobId
            }
        });
        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                id: _crypto.randomUUID(),
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: application.job.referralFee,
                currency: 'INR',
                status: _constants.PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
                updatedAt: new Date()
            }
        });
        // Update application status
        await this.prisma.jobApplication.update({
            where: {
                id: application.id
            },
            data: {
                status: _constants.ApplicationStatus.PAYMENT_PENDING
            }
        });
        // Update referral status
        await this.prisma.referral.update({
            where: {
                applicationId: application.id
            },
            data: {
                status: _constants.ReferralStatus.PAYMENT_PENDING
            }
        });
        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId,
                action: _constants.AuditAction.PAYMENT_INITIATED,
                entityType: 'Payment',
                entityId: payment.id,
                metadata: {
                    orderId: order.id,
                    amount: application.job.referralFee
                }
            }
        });
        return {
            orderId: order.id,
            amount: application.job.referralFee,
            currency: 'INR',
            paymentId: payment.id,
            keyId: this.configService.get('RAZORPAY_KEY_ID')
        };
    }
    // Verify payment (client-side callback)
    async verifyPayment(userId, dto) {
        // Verify signature
        const isValid = this.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid payment signature');
        }
        // Get payment
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: dto.razorpayOrderId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true
                    }
                }
            }
        });
        if (!payment) {
            throw new _common.NotFoundException('Payment not found');
        }
        if (payment.JobApplication.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (payment.status === _constants.PaymentStatus.SUCCESS) {
            return {
                success: true,
                message: 'Payment already verified'
            };
        }
        // Update payment
        await this.prisma.payment.update({
            where: {
                id: payment.id
            },
            data: {
                razorpayPaymentId: dto.razorpayPaymentId,
                razorpaySignature: dto.razorpaySignature,
                status: _constants.PaymentStatus.PENDING
            }
        });
        return {
            success: true,
            message: 'Payment verification initiated'
        };
    }
    // Webhook handler (source of truth)
    async handleWebhook(payload, signature) {
        // Verify webhook signature
        const isValid = this.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid webhook signature');
        }
        const event = payload.event;
        const paymentData = payload.payload?.Payment?.entity;
        if (!paymentData) {
            return {
                success: true
            };
        }
        const orderId = paymentData.order_id;
        // Idempotency check
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: orderId
            },
            include: {
                JobApplication: true
            }
        });
        if (!payment) {
            return {
                success: true,
                message: 'Payment not found'
            };
        }
        // Already processed
        if (payment.status === _constants.PaymentStatus.SUCCESS || payment.status === _constants.PaymentStatus.REFUNDED) {
            return {
                success: true,
                message: 'Already processed'
            };
        }
        if (event === 'payment.captured' || event === 'payment.authorized') {
            await this.processSuccessfulPayment(payment, paymentData);
        } else if (event === 'payment.failed') {
            await this.processFailedPayment(payment, paymentData);
        }
        return {
            success: true
        };
    }
    async processSuccessfulPayment(payment, paymentData) {
        await this.prisma.$transaction(async (tx)=>{
            // Update payment
            await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    razorpayPaymentId: paymentData.id,
                    status: _constants.PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                    webhookPayload: paymentData
                }
            });
            // Check if this payment is for an interview
            const interview = await tx.interview.findUnique({
                where: {
                    applicationId: payment.applicationId
                }
            });
            if (interview && interview.status === 'INTERVIEW_CONFIRMED') {
                // This is an interview payment - update interview status
                await tx.interview.update({
                    where: {
                        id: interview.id
                    },
                    data: {
                        status: 'PAYMENT_SUCCESS',
                        paymentStatus: _constants.PaymentStatus.SUCCESS,
                        paidAt: new Date()
                    }
                });
            // Note: Interview payment confirmation email will be sent separately
            } else {
                // This is a referral/legacy payment - update to PAYMENT_SUCCESS
                await tx.jobApplication.update({
                    where: {
                        id: payment.applicationId
                    },
                    data: {
                        status: _constants.ApplicationStatus.PAYMENT_SUCCESS,
                        contactUnlockedAt: new Date()
                    }
                });
                // Update referral
                await tx.referral.update({
                    where: {
                        applicationId: payment.applicationId
                    },
                    data: {
                        status: _constants.ReferralStatus.CONTACTED
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    action: _constants.AuditAction.PAYMENT_SUCCESS,
                    entityType: 'Payment',
                    entityId: payment.id,
                    metadata: {
                        razorpayPaymentId: paymentData.id
                    }
                }
            });
        });
    }
    async processFailedPayment(payment, paymentData) {
        await this.prisma.payment.update({
            where: {
                id: payment.id
            },
            data: {
                status: _constants.PaymentStatus.FAILED,
                failureReason: paymentData.error_description || 'Payment failed',
                webhookPayload: paymentData
            }
        });
        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                action: _constants.AuditAction.PAYMENT_FAILED,
                entityType: 'Payment',
                entityId: payment.id,
                metadata: {
                    error: paymentData.error_description
                }
            }
        });
    }
    // Get payment history
    async getPaymentHistory(userId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: {
                userId
            }
        });
        if (!candidate) {
            throw new _common.NotFoundException('Candidate not found');
        }
        return this.prisma.payment.findMany({
            where: {
                JobApplication: {
                    candidateId: candidate.id
                }
            },
            include: {
                JobApplication: {
                    include: {
                        Job: {
                            select: {
                                title: true,
                                companyName: true
                            }
                        }
                    }
                },
                Refund: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // Get payment by ID
    async getPaymentById(userId, paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: paymentId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true,
                        Job: true
                    }
                },
                Refund: true
            }
        });
        if (!payment) {
            throw new _common.NotFoundException('Payment not found');
        }
        if (payment.JobApplication.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        return payment;
    }
    // Request refund
    async requestRefund(userId, dto) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: dto.paymentId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: true,
                        Referral: true
                    }
                },
                Refund: true
            }
        });
        if (!payment) {
            throw new _common.NotFoundException('Payment not found');
        }
        if (payment.JobApplication.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (payment.status !== _constants.PaymentStatus.SUCCESS) {
            throw new _common.BadRequestException('Only successful payments can be refunded');
        }
        if (payment.Refund) {
            throw new _common.BadRequestException('Refund already requested');
        }
        // Check if interview details were already unlocked
        if (payment.JobApplication.status === _constants.ApplicationStatus.PAYMENT_SUCCESS || payment.JobApplication.Referral?.status === _constants.ReferralStatus.CONTACTED) {
            throw new _common.BadRequestException('Refund not available after details have been shared');
        }
        // Create refund request
        const refund = await this.prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: payment.amount,
                reason: dto.reason,
                status: _constants.RefundStatus.REQUESTED
            }
        });
        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId,
                action: _constants.AuditAction.REFUND_REQUESTED,
                entityType: 'Refund',
                entityId: refund.id,
                metadata: {
                    paymentId: payment.id,
                    reason: dto.reason
                }
            }
        });
        return refund;
    }
    // =============================================
    // INTERVIEW PAYMENT METHODS (₹99)
    // =============================================
    /**
   * Create payment order for interview (₹99)
   */ async createInterviewOrder(userId, applicationId) {
        // Get application with interview
        const application = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            },
            include: {
                Candidate: true,
                Job: true,
                Interview: true
            }
        });
        if (!application) {
            throw new _common.NotFoundException('Application not found');
        }
        if (application.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        // Verify interview exists and is pending payment
        if (!application.Interview) {
            throw new _common.BadRequestException('No interview request found for this application');
        }
        // Allow payment when interview is INTERVIEW_CONFIRMED (HR confirmed, awaiting payment)
        // or PAYMENT_PENDING (legacy flow)
        const allowedStatuses = [
            'INTERVIEW_CONFIRMED',
            'PAYMENT_PENDING'
        ];
        if (!allowedStatuses.includes(application.Interview.status)) {
            throw new _common.BadRequestException(`Interview is in ${application.Interview.status} status. Payment not available.`);
        }
        // Check for existing successful payment for this interview
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: _constants.PaymentStatus.SUCCESS,
                amount: 99
            }
        });
        if (existingPayment) {
            throw new _common.BadRequestException('Interview payment already completed');
        }
        // Check for pending order
        const pendingPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: {
                    in: [
                        _constants.PaymentStatus.ORDER_CREATED,
                        _constants.PaymentStatus.PENDING
                    ]
                },
                amount: 99
            }
        });
        if (pendingPayment && pendingPayment.razorpayOrderId) {
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: 99,
                currency: 'INR',
                paymentId: pendingPayment.id,
                keyId: this.configService.get('RAZORPAY_KEY_ID')
            };
        }
        const amount = 9900; // ₹99 in paise
        // Check for test mode - bypasses Razorpay and directly creates successful payment
        const testMode = this.configService.get('PAYMENT_TEST_MODE') === 'true';
        if (testMode) {
            // TEST MODE: Directly create successful payment and update interview
            const paymentId = _crypto.randomUUID();
            const testOrderId = `test_order_${Date.now()}`;
            await this.prisma.$transaction(async (tx)=>{
                // Create payment record as SUCCESS
                await tx.payment.create({
                    data: {
                        id: paymentId,
                        applicationId: application.id,
                        razorpayOrderId: testOrderId,
                        razorpayPaymentId: `test_pay_${Date.now()}`,
                        amount: 99,
                        currency: 'INR',
                        status: _constants.PaymentStatus.SUCCESS,
                        orderCreatedAt: new Date(),
                        paidAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                // Update interview status
                await tx.interview.update({
                    where: {
                        id: application.Interview.id
                    },
                    data: {
                        status: 'PAYMENT_SUCCESS',
                        paymentStatus: _constants.PaymentStatus.SUCCESS,
                        paidAt: new Date()
                    }
                });
                // Update application status
                await tx.jobApplication.update({
                    where: {
                        id: application.id
                    },
                    data: {
                        status: 'PAYMENT_SUCCESS',
                        contactUnlockedAt: new Date()
                    }
                });
            });
            // Return test mode response - frontend will show success directly
            return {
                testMode: true,
                success: true,
                message: 'TEST MODE: Payment completed successfully',
                orderId: testOrderId,
                paymentId: paymentId
            };
        }
        // PRODUCTION MODE: Create Razorpay order
        const razorpay = this.ensureRazorpay();
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `int_${application.id.slice(0, 18)}`,
            notes: {
                applicationId: application.id,
                interviewId: application.Interview.id,
                candidateId: application.candidateId,
                type: 'INTERVIEW'
            }
        });
        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                id: _crypto.randomUUID(),
                applicationId: application.id,
                razorpayOrderId: order.id,
                amount: 99,
                currency: 'INR',
                status: _constants.PaymentStatus.ORDER_CREATED,
                orderCreatedAt: new Date(),
                updatedAt: new Date()
            }
        });
        // Audit log
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId,
                action: _constants.AuditAction.PAYMENT_INITIATED,
                entityType: 'InterviewPayment',
                entityId: payment.id,
                metadata: {
                    orderId: order.id,
                    amount: 99,
                    interviewId: application.Interview.id
                }
            }
        });
        return {
            orderId: order.id,
            amount: 99,
            currency: 'INR',
            paymentId: payment.id,
            keyId: this.configService.get('RAZORPAY_KEY_ID')
        };
    }
    /**
   * Verify interview payment and update interview status
   */ async verifyInterviewPayment(userId, dto) {
        // Verify signature
        const isValid = this.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid payment signature');
        }
        // Get payment
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: dto.razorpayOrderId
            },
            include: {
                JobApplication: {
                    include: {
                        Candidate: {
                            include: {
                                User: true
                            }
                        },
                        Interview: true,
                        Job: {
                            include: {
                                HR: {
                                    include: {
                                        User: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!payment) {
            throw new _common.NotFoundException('Payment not found');
        }
        if (payment.JobApplication.Candidate.userId !== userId) {
            throw new _common.ForbiddenException('Not authorized');
        }
        if (payment.status === _constants.PaymentStatus.SUCCESS) {
            return {
                success: true,
                message: 'Payment already verified'
            };
        }
        const interview = payment.JobApplication.Interview;
        if (!interview) {
            throw new _common.BadRequestException('Interview not found');
        }
        // Update payment and interview in transaction
        await this.prisma.$transaction(async (tx)=>{
            // Update payment status
            await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    razorpayPaymentId: dto.razorpayPaymentId,
                    status: _constants.PaymentStatus.SUCCESS,
                    paidAt: new Date()
                }
            });
            // Update interview status to PAYMENT_SUCCESS
            await tx.interview.update({
                where: {
                    id: interview.id
                },
                data: {
                    status: 'PAYMENT_SUCCESS',
                    paymentStatus: _constants.PaymentStatus.SUCCESS,
                    paidAt: new Date()
                }
            });
            // CRITICAL: Also update application status to PAYMENT_SUCCESS
            await tx.jobApplication.update({
                where: {
                    id: payment.applicationId
                },
                data: {
                    status: _constants.ApplicationStatus.PAYMENT_SUCCESS,
                    contactUnlockedAt: new Date()
                }
            });
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId,
                    action: _constants.AuditAction.PAYMENT_SUCCESS,
                    entityType: 'InterviewPayment',
                    entityId: payment.id,
                    metadata: {
                        razorpayPaymentId: dto.razorpayPaymentId,
                        interviewId: interview.id
                    }
                }
            });
        });
        // TODO: Send email notification to HR that payment is complete
        // this.emailService.sendInterviewPaymentConfirmation(...)
        return {
            success: true,
            message: 'Interview payment verified. HR will schedule your interview soon.'
        };
    }
    // Signature verification helpers
    verifySignature(orderId, paymentId, signature) {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET');
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = _crypto.createHmac('sha256', secret).update(body).digest('hex');
        return expectedSignature === signature;
    }
    verifyWebhookSignature(payload, signature) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        const body = JSON.stringify(payload);
        const expectedSignature = _crypto.createHmac('sha256', secret).update(body).digest('hex');
        return expectedSignature === signature;
    }
    constructor(prisma, configService){
        this.prisma = prisma;
        this.configService = configService;
        this.razorpay = null;
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
        if (keyId && keySecret && keyId !== 'rzp_test_your_key_id') {
            this.razorpay = new _razorpay.default({
                key_id: keyId,
                key_secret: keySecret
            });
        } else {
            console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
        }
    }
};
PaymentService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PaymentService);

//# sourceMappingURL=payment.service.js.map