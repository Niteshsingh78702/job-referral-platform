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
exports.ReferralController = void 0;
const common_1 = require("@nestjs/common");
const referral_service_1 = require("./referral.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let ReferralController = class ReferralController {
    referralService;
    constructor(referralService) {
        this.referralService = referralService;
    }
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
};
exports.ReferralController = ReferralController;
__decorate([
    (0, common_1.Get)('pending/hr'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getPendingForHR", null);
__decorate([
    (0, common_1.Get)('pending/employee'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getPendingForEmployee", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR, constants_1.UserRole.EMPLOYEE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, dto_1.ConfirmReferralDto]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "confirmReferral", null);
__decorate([
    (0, common_1.Patch)(':id/contacted'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)('feedback')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "markAsContacted", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)('feedback')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "closeReferral", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR, constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralHistory", null);
exports.ReferralController = ReferralController = __decorate([
    (0, common_1.Controller)('referrals'),
    __metadata("design:paramtypes", [referral_service_1.ReferralService])
], ReferralController);
//# sourceMappingURL=referral.controller.js.map