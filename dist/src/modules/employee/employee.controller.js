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
exports.EmployeeController = void 0;
const common_1 = require("@nestjs/common");
const employee_service_1 = require("./employee.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const constants_1 = require("../../common/constants");
let EmployeeController = class EmployeeController {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
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
    async markReferralAsHired(referralId) {
        return this.employeeService.markReferralAsHired(referralId);
    }
};
exports.EmployeeController = EmployeeController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateEmployeeProfileDto]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('available-referrals'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getAvailableReferrals", null);
__decorate([
    (0, common_1.Get)('referrals'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ReferralFiltersDto]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getMyReferrals", null);
__decorate([
    (0, common_1.Post)('referrals/:applicationId/confirm'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "confirmReferral", null);
__decorate([
    (0, common_1.Get)('earnings'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EarningsFiltersDto]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)('tier'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getCurrentTier", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/read'),
    (0, decorators_1.Roles)(constants_1.UserRole.EMPLOYEE),
    __param(0, (0, decorators_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "markNotificationRead", null);
__decorate([
    (0, common_1.Post)('referrals/:referralId/mark-hired'),
    (0, decorators_1.Roles)(constants_1.UserRole.HR, constants_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('referralId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "markReferralAsHired", null);
exports.EmployeeController = EmployeeController = __decorate([
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], EmployeeController);
//# sourceMappingURL=employee.controller.js.map