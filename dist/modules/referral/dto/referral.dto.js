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
    get ConfirmReferralDto () {
        return ConfirmReferralDto;
    },
    get UpdateReferralStatusDto () {
        return UpdateReferralStatusDto;
    }
});
const _classvalidator = require("class-validator");
const _constants = require("../../../common/constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ConfirmReferralDto = class ConfirmReferralDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_constants.ReferralType),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _constants.ReferralType === "undefined" ? Object : _constants.ReferralType)
], ConfirmReferralDto.prototype, "type", void 0);
let UpdateReferralStatusDto = class UpdateReferralStatusDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_constants.ReferralStatus),
    _ts_metadata("design:type", typeof _constants.ReferralStatus === "undefined" ? Object : _constants.ReferralStatus)
], UpdateReferralStatusDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], UpdateReferralStatusDto.prototype, "feedback", void 0);

//# sourceMappingURL=referral.dto.js.map