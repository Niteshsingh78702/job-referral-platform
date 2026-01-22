"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreatePaymentOrderDto () {
        return CreatePaymentOrderDto;
    },
    get ProcessRefundDto () {
        return ProcessRefundDto;
    },
    get RequestRefundDto () {
        return RequestRefundDto;
    },
    get VerifyPaymentDto () {
        return VerifyPaymentDto;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreatePaymentOrderDto = class CreatePaymentOrderDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreatePaymentOrderDto.prototype, "applicationId", void 0);
let VerifyPaymentDto = class VerifyPaymentDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayOrderId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
let RequestRefundDto = class RequestRefundDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestRefundDto.prototype, "paymentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RequestRefundDto.prototype, "reason", void 0);
let ProcessRefundDto = class ProcessRefundDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], ProcessRefundDto.prototype, "adminNotes", void 0);

//# sourceMappingURL=payment.dto.js.map