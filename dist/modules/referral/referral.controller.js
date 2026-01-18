"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReferralController", {
    enumerable: true,
    get: function() {
        return ReferralController;
    }
});
const _common = require("@nestjs/common");
const _referralservice = require("./referral.service");
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
let ReferralController = class ReferralController {
    async getPendingForHR(userId) {
        return this.referralService.getPendingReferralsForHR(userId);
    }
    async getPendingForEmployee(userId) {
        return this.referralService.getPendingReferralsForEmployee(userId);
    }
    async confirmReferral(referralId, userId, userRole, dto) {
        return this.referralService.confirmReferral(referralId, userId, userRole, dto);
    }
    async markAsContacted(referralId, userId, feedback) {
        return this.referralService.markAsContacted(referralId, userId, feedback);
    }
    async closeReferral(referralId, userId, feedback) {
        return this.referralService.closeReferral(referralId, userId, feedback);
    }
    async getReferralHistory(userId, userRole) {
        return this.referralService.getReferralHistory(userId, userRole);
    }
    constructor(referralService){
        this.referralService = referralService;
    }
};
_ts_decorate([
    (0, _common.Get)('pending/hr'),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "getPendingForHR", null);
_ts_decorate([
    (0, _common.Get)('pending/employee'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "getPendingForEmployee", null);
_ts_decorate([
    (0, _common.Post)(':id/confirm'),
    (0, _decorators.Roles)(_constants.UserRole.HR, _constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _decorators.CurrentUser)('role')),
    _ts_param(3, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        typeof _dto.ConfirmReferralDto === "undefined" ? Object : _dto.ConfirmReferralDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "confirmReferral", null);
_ts_decorate([
    (0, _common.Patch)(':id/contacted'),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('feedback')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "markAsContacted", null);
_ts_decorate([
    (0, _common.Patch)(':id/close'),
    (0, _decorators.Roles)(_constants.UserRole.HR),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _decorators.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('feedback')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "closeReferral", null);
_ts_decorate([
    (0, _common.Get)('history'),
    (0, _decorators.Roles)(_constants.UserRole.HR, _constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _decorators.CurrentUser)('role')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralHistory", null);
ReferralController = _ts_decorate([
    (0, _common.Controller)('referrals'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _referralservice.ReferralService === "undefined" ? Object : _referralservice.ReferralService
    ])
], ReferralController);

//# sourceMappingURL=referral.controller.js.map