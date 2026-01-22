"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentController", {
    enumerable: true,
    get: function() {
        return PaymentController;
    }
});
const _common = require("@nestjs/common");
const _paymentservice = require("./payment.service");
const _dto = require("./dto");
const _decorators = require("../../common/decorators");
const _constants = require("../../common/constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let PaymentController = class PaymentController {
    async createOrder(userId, dto) {
        return this.paymentService.createOrder(userId, dto);
    }
    async verifyPayment(userId, dto) {
        return this.paymentService.verifyPayment(userId, dto);
    }
    async handleWebhook(payload, signature) {
        return this.paymentService.handleWebhook(payload, signature);
    }
    async getPaymentHistory(userId) {
        return this.paymentService.getPaymentHistory(userId);
    }
    async getPayment(userId, paymentId) {
        return this.paymentService.getPaymentById(userId, paymentId);
    }
    async requestRefund(userId, dto) {
        return this.paymentService.requestRefund(userId, dto);
    }
    // =============================================
    // INTERVIEW PAYMENT ENDPOINTS (₹99)
    // =============================================
    async createInterviewOrder(userId, dto) {
        const result = await this.paymentService.createInterviewOrder(userId, dto.applicationId);
        return {
            success: true,
            data: result
        };
    }
    async verifyInterviewPayment(userId, dto) {
        const result = await this.paymentService.verifyInterviewPayment(userId, dto);
        return {
            success: true,
            data: result
        };
    }
    constructor(paymentService){
        this.paymentService = paymentService;
    }
};
_ts_decorate([
    (0, _common.Post)('create-order'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.CreatePaymentOrderDto === "undefined" ? Object : _dto.CreatePaymentOrderDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "createOrder", null);
_ts_decorate([
    (0, _common.Post)('verify'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.VerifyPaymentDto === "undefined" ? Object : _dto.VerifyPaymentDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('webhook'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Headers)('x-razorpay-signature')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
_ts_decorate([
    (0, _common.Get)('history'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentHistory", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "getPayment", null);
_ts_decorate([
    (0, _common.Post)('refund/request'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.RequestRefundDto === "undefined" ? Object : _dto.RequestRefundDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "requestRefund", null);
_ts_decorate([
    (0, _common.Post)('interview/create-order'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "createInterviewOrder", null);
_ts_decorate([
    (0, _common.Post)('interview/verify'),
    (0, _decorators.Roles)(_constants.UserRole.CANDIDATE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.VerifyPaymentDto === "undefined" ? Object : _dto.VerifyPaymentDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyInterviewPayment", null);
PaymentController = _ts_decorate([
    (0, _common.Controller)('payments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentservice.PaymentService === "undefined" ? Object : _paymentservice.PaymentService
    ])
], PaymentController);

//# sourceMappingURL=payment.controller.js.map