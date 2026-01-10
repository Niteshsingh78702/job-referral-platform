"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
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
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create-order'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePaymentOrderDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.VerifyPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Post)('refund/request'),
    (0, decorators_1.Roles)(constants_1.UserRole.CANDIDATE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RequestRefundDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "requestRefund", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map