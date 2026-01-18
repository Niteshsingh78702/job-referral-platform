"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EmployeeController", {
    enumerable: true,
    get: function() {
        return EmployeeController;
    }
});
const _common = require("@nestjs/common");
const _employeeservice = require("./employee.service");
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
let EmployeeController = class EmployeeController {
    async getProfile(userId) {
        return this.employeeService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.employeeService.updateProfile(userId, dto);
    }
    async getDashboardStats(userId) {
        return this.employeeService.getDashboardStats(userId);
    }
    async getAvailableReferrals(userId, search) {
        return this.employeeService.getAvailableReferrals(userId, search);
    }
    async getMyReferrals(userId, filters) {
        return this.employeeService.getMyReferrals(userId, filters);
    }
    async confirmReferral(userId, applicationId) {
        return this.employeeService.confirmReferral(userId, applicationId);
    }
    async getEarnings(userId, filters) {
        return this.employeeService.getEarnings(userId, filters);
    }
    async getCurrentTier(userId) {
        return this.employeeService.getCurrentTier(userId);
    }
    async getLeaderboard(userId, period) {
        return this.employeeService.getLeaderboard(userId, period || 'all');
    }
    async getNotifications(userId, limit) {
        return this.employeeService.getNotifications(userId, limit || 10);
    }
    async markNotificationRead(userId, notificationId) {
        return this.employeeService.markNotificationRead(userId, notificationId);
    }
    // Admin/HR endpoint to mark referral as hired
    async markReferralAsHired(referralId) {
        return this.employeeService.markReferralAsHired(referralId);
    }
    constructor(employeeService){
        this.employeeService = employeeService;
    }
};
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.UpdateEmployeeProfileDto === "undefined" ? Object : _dto.UpdateEmployeeProfileDto
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Get)('dashboard/stats'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getDashboardStats", null);
_ts_decorate([
    (0, _common.Get)('available-referrals'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getAvailableReferrals", null);
_ts_decorate([
    (0, _common.Get)('referrals'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.ReferralFiltersDto === "undefined" ? Object : _dto.ReferralFiltersDto
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getMyReferrals", null);
_ts_decorate([
    (0, _common.Post)('referrals/:applicationId/confirm'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('applicationId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "confirmReferral", null);
_ts_decorate([
    (0, _common.Get)('earnings'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.EarningsFiltersDto === "undefined" ? Object : _dto.EarningsFiltersDto
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getEarnings", null);
_ts_decorate([
    (0, _common.Get)('tier'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getCurrentTier", null);
_ts_decorate([
    (0, _common.Get)('leaderboard'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('period')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getLeaderboard", null);
_ts_decorate([
    (0, _common.Get)('notifications'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "getNotifications", null);
_ts_decorate([
    (0, _common.Patch)('notifications/:id/read'),
    (0, _decorators.Roles)(_constants.UserRole.EMPLOYEE),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "markNotificationRead", null);
_ts_decorate([
    (0, _common.Post)('referrals/:referralId/mark-hired'),
    (0, _decorators.Roles)(_constants.UserRole.HR, _constants.UserRole.ADMIN),
    _ts_param(0, (0, _common.Param)('referralId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EmployeeController.prototype, "markReferralAsHired", null);
EmployeeController = _ts_decorate([
    (0, _common.Controller)('employees'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _employeeservice.EmployeeService === "undefined" ? Object : _employeeservice.EmployeeService
    ])
], EmployeeController);

//# sourceMappingURL=employee.controller.js.map