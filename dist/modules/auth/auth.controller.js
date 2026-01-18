"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _services = require("./services");
const _dto = require("./dto");
const _decorators = require("../../common/decorators");
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
let AuthController = class AuthController {
    async register(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id']
        };
        return this.authService.register(dto, deviceInfo);
    }
    async login(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id']
        };
        return this.authService.login(dto, deviceInfo);
    }
    async googleLogin(dto, req) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id']
        };
        return this.authService.googleLogin(dto, deviceInfo);
    }
    async sendOtp(dto) {
        return this.authService.sendOtp(dto);
    }
    async verifyOtp(dto) {
        return this.authService.verifyOtp(dto);
    }
    async refreshToken(dto) {
        return this.authService.refreshToken(dto);
    }
    async logout(userId) {
        return this.authService.logout(userId);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    async resetPasswordWithToken(dto) {
        return this.authService.resetPasswordWithToken(dto);
    }
    async changePassword(userId, dto) {
        return this.authService.changePassword(userId, dto);
    }
    async getCurrentUser(userId) {
        return this.authService.getCurrentUser(userId);
    }
    constructor(authService){
        this.authService = authService;
    }
};
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('register'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.RegisterDto === "undefined" ? Object : _dto.RegisterDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.LoginDto === "undefined" ? Object : _dto.LoginDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('google'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.GoogleAuthDto === "undefined" ? Object : _dto.GoogleAuthDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('send-otp'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.SendOtpDto === "undefined" ? Object : _dto.SendOtpDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('verify-otp'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.VerifyOtpDto === "undefined" ? Object : _dto.VerifyOtpDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('refresh'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.RefreshTokenDto === "undefined" ? Object : _dto.RefreshTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
_ts_decorate([
    (0, _common.Post)('logout'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('forgot-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ForgotPasswordDto === "undefined" ? Object : _dto.ForgotPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('reset-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ResetPasswordDto === "undefined" ? Object : _dto.ResetPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
_ts_decorate([
    (0, _decorators.Public)(),
    (0, _common.Post)('reset-password-with-token'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dto.ResetPasswordWithTokenDto === "undefined" ? Object : _dto.ResetPasswordWithTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "resetPasswordWithToken", null);
_ts_decorate([
    (0, _common.Post)('change-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _dto.ChangePasswordDto === "undefined" ? Object : _dto.ChangePasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
_ts_decorate([
    (0, _common.Get)('me'),
    _ts_param(0, (0, _decorators.CurrentUser)('sub')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
AuthController = _ts_decorate([
    (0, _common.Controller)('auth'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _services.AuthService === "undefined" ? Object : _services.AuthService
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map