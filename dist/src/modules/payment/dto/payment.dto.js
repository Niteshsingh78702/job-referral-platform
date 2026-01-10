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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessRefundDto = exports.RequestRefundDto = exports.VerifyPaymentDto = exports.CreatePaymentOrderDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePaymentOrderDto {
    applicationId;
}
exports.CreatePaymentOrderDto = CreatePaymentOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentOrderDto.prototype, "applicationId", void 0);
class VerifyPaymentDto {
    razorpayOrderId;
    razorpayPaymentId;
    razorpaySignature;
}
exports.VerifyPaymentDto = VerifyPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
class RequestRefundDto {
    paymentId;
    reason;
}
exports.RequestRefundDto = RequestRefundDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestRefundDto.prototype, "paymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestRefundDto.prototype, "reason", void 0);
class ProcessRefundDto {
    adminNotes;
}
exports.ProcessRefundDto = ProcessRefundDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessRefundDto.prototype, "adminNotes", void 0);
//# sourceMappingURL=payment.dto.js.map