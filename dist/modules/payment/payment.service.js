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
const _cashfreepg = require("cashfree-pg");
const _prismaservice = require("../../prisma/prisma.service");
const _constants = require("../../common/constants");
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
    ensureCashfree() {
        if (!this.cashfree) {
            throw new _common.BadRequestException('Payment service is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
        }
        return this.cashfree;
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
        // Verify eligibility
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
            // Return existing order — re-fetch session from Cashfree
            return {
                orderId: pendingPayment.razorpayOrderId,
                amount: pendingPayment.amount,
                currency: pendingPayment.currency,
                paymentId: pendingPayment.id
            };
        }
        const amount = application.Job.referralFee;
        // Create Cashfree order
        const cashfree = this.ensureCashfree();
        const cfOrderId = `order_${_crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
        const request = {
            order_amount: amount,
            order_currency: 'INR',
            order_id: cfOrderId,
            customer_details: {
                customer_id: userId.slice(0, 50),
                customer_phone: '9999999999'
            },
            order_meta: {
                return_url: `${this.configService.get('FRONTEND_URL') || 'https://www.naukrishetu.com'}/index.html?payment_status=success&order_id=${cfOrderId}`
            },
            order_note: `Payment for application ${application.id}`
        };
        const response = await cashfree.PGCreateOrder(request);
        const orderData = response.data;
        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                id: _crypto.randomUUID(),
                applicationId: application.id,
                razorpayOrderId: cfOrderId,
                amount: application.Job.referralFee,
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
                    orderId: cfOrderId,
                    amount: application.Job.referralFee
                }
            }
        });
        return {
            orderId: cfOrderId,
            amount: application.Job.referralFee,
            currency: 'INR',
            paymentId: payment.id,
            paymentSessionId: orderData.payment_session_id
        };
    }
    // Verify payment (called when user returns from Cashfree checkout)
    async verifyPayment(userId, dto) {
        const cashfree = this.ensureCashfree();
        // Fetch order status from Cashfree
        const response = await cashfree.PGOrderFetchPayments(dto.orderId);
        const payments = response.data;
        if (!payments || payments.length === 0) {
            throw new _common.BadRequestException('No payments found for this order');
        }
        // Find the successful payment
        const successfulCfPayment = payments.find((p)=>p.payment_status === 'SUCCESS');
        if (!successfulCfPayment) {
            throw new _common.BadRequestException('Payment not successful');
        }
        // Get payment from DB
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: dto.orderId
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
                razorpayPaymentId: successfulCfPayment.cf_payment_id?.toString(),
                status: _constants.PaymentStatus.SUCCESS,
                paidAt: new Date()
            }
        });
        return {
            success: true,
            message: 'Payment verified successfully'
        };
    }
    // Webhook handler (source of truth)
    async handleWebhook(payload, signature) {
        // Verify webhook signature
        const timestamp = payload?.data?.payment?.payment_time || '';
        const isValid = this.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid webhook signature');
        }
        const eventType = payload.type;
        const paymentData = payload.data?.payment;
        const orderData = payload.data?.order;
        if (!paymentData && !orderData) {
            return {
                success: true
            };
        }
        const orderId = orderData?.order_id || paymentData?.order?.order_id;
        if (!orderId) {
            return {
                success: true,
                message: 'No order ID in webhook'
            };
        }
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
        if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'PAYMENT_SUCCESS') {
            await this.processSuccessfulPayment(payment, paymentData);
        } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || eventType === 'PAYMENT_FAILED') {
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
                    razorpayPaymentId: paymentData?.cf_payment_id?.toString(),
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
                        cfPaymentId: paymentData?.cf_payment_id
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
                failureReason: paymentData?.payment_message || 'Payment failed',
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
                    error: paymentData?.payment_message
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
        // Allow payment when interview is INTERVIEW_CONFIRMED or PAYMENT_PENDING
        const allowedStatuses = [
            'INTERVIEW_CONFIRMED',
            'PAYMENT_PENDING'
        ];
        if (!allowedStatuses.includes(application.Interview.status)) {
            throw new _common.BadRequestException(`Interview is in ${application.Interview.status} status. Payment not available.`);
        }
        // Check for existing successful payment
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
            // Re-create order with Cashfree to get fresh session
            try {
                const cashfree = this.ensureCashfree();
                const response = await cashfree.PGFetchOrder(pendingPayment.razorpayOrderId);
                if (response.data?.payment_session_id) {
                    return {
                        orderId: pendingPayment.razorpayOrderId,
                        amount: 99,
                        currency: 'INR',
                        paymentId: pendingPayment.id,
                        paymentSessionId: response.data.payment_session_id
                    };
                }
            } catch (e) {
            // If fetching existing order fails, create a new one below
            }
        }
        const amount = 99; // ₹99
        // Check for test mode - bypasses Cashfree and directly creates successful payment
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
                if (application.Interview) {
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
                }
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
            // Return test mode response
            return {
                testMode: true,
                success: true,
                message: 'TEST MODE: Payment completed successfully',
                orderId: testOrderId,
                paymentId: paymentId
            };
        }
        // PRODUCTION MODE: Create Cashfree order
        const cashfree = this.ensureCashfree();
        const cfOrderId = `int_${_crypto.randomUUID().replace(/-/g, '').slice(0, 22)}`;
        const request = {
            order_amount: amount,
            order_currency: 'INR',
            order_id: cfOrderId,
            customer_details: {
                customer_id: userId.slice(0, 50),
                customer_phone: '9999999999'
            },
            order_meta: {
                return_url: `${this.configService.get('FRONTEND_URL') || 'https://www.naukrishetu.com'}/index.html?payment_status=success&order_id=${cfOrderId}`
            },
            order_note: `Interview payment for application ${application.id}`
        };
        const response = await cashfree.PGCreateOrder(request);
        const orderData = response.data;
        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                id: _crypto.randomUUID(),
                applicationId: application.id,
                razorpayOrderId: cfOrderId,
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
                    orderId: cfOrderId,
                    amount: 99,
                    interviewId: application.Interview.id
                }
            }
        });
        return {
            orderId: cfOrderId,
            amount: 99,
            currency: 'INR',
            paymentId: payment.id,
            paymentSessionId: orderData.payment_session_id
        };
    }
    /**
   * Verify interview payment (called when user returns from Cashfree checkout)
   */ async verifyInterviewPayment(userId, dto) {
        const cashfree = this.ensureCashfree();
        // Fetch payment status from Cashfree
        const response = await cashfree.PGOrderFetchPayments(dto.orderId);
        const cfPayments = response.data;
        if (!cfPayments || cfPayments.length === 0) {
            throw new _common.BadRequestException('No payments found for this order. Payment may still be processing.');
        }
        // Find the successful payment
        const successfulCfPayment = cfPayments.find((p)=>p.payment_status === 'SUCCESS');
        if (!successfulCfPayment) {
            throw new _common.BadRequestException('Payment not yet successful. Please try again.');
        }
        // Get payment from DB
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: dto.orderId
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
                    razorpayPaymentId: successfulCfPayment.cf_payment_id?.toString(),
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
            // Update application status to PAYMENT_SUCCESS
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
                        cfPaymentId: successfulCfPayment.cf_payment_id,
                        interviewId: interview.id
                    }
                }
            });
        });
        return {
            success: true,
            message: 'Interview payment verified. HR will schedule your interview soon.'
        };
    }
    // Webhook signature verification
    verifyWebhookSignature(payload, signature) {
        try {
            const secretKey = this.configService.get('CASHFREE_SECRET_KEY');
            if (!secretKey) return false;
            const body = JSON.stringify(payload);
            const expectedSignature = _crypto.createHmac('sha256', secretKey).update(body).digest('base64');
            return expectedSignature === signature;
        } catch (e) {
            return false;
        }
    }
    constructor(prisma, configService){
        this.prisma = prisma;
        this.configService = configService;
        this.cashfree = null;
        const appId = this.configService.get('CASHFREE_APP_ID');
        const secretKey = this.configService.get('CASHFREE_SECRET_KEY');
        const env = this.configService.get('CASHFREE_ENV') || 'PRODUCTION';
        if (appId && secretKey && appId !== 'your_cashfree_app_id') {
            this.cashfree = new _cashfreepg.Cashfree(env === 'PRODUCTION' ? _cashfreepg.Cashfree.PRODUCTION : _cashfreepg.Cashfree.SANDBOX, appId, secretKey);
        } else {
            console.warn('⚠️ Cashfree credentials not configured. Payment features will be disabled.');
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