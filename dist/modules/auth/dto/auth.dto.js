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
    get ChangePasswordDto () {
        return ChangePasswordDto;
    },
    get ForgotPasswordDto () {
        return ForgotPasswordDto;
    },
    get GoogleAuthDto () {
        return GoogleAuthDto;
    },
    get LoginDto () {
        return LoginDto;
    },
    get RefreshTokenDto () {
        return RefreshTokenDto;
    },
    get RegisterDto () {
        return RegisterDto;
    },
    get ResetPasswordDto () {
        return ResetPasswordDto;
    },
    get ResetPasswordWithTokenDto () {
        return ResetPasswordWithTokenDto;
    },
    get SendOtpDto () {
        return SendOtpDto;
    },
    get VerifyOtpDto () {
        return VerifyOtpDto;
    }
});
const _classvalidator = require("class-validator");
const _constants = require("../../../common/constants");
const _validators = require("../../../common/validators");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RegisterDto = class RegisterDto {
    constructor(){
        this.role = _constants.UserRole.CANDIDATE;
    }
};
_ts_decorate([
    (0, _classvalidator.IsEmail)({}, {
        message: 'Please enter a valid email address'
    }),
    (0, _validators.IsValidEmailDomain)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsPhoneNumber)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_constants.UserRole),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _constants.UserRole === "undefined" ? Object : _constants.UserRole)
], RegisterDto.prototype, "role", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "companyName", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "designation", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RegisterDto.prototype, "department", void 0);
let LoginDto = class LoginDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)({}, {
        message: 'Please enter a valid email address'
    }),
    (0, _validators.IsValidEmailDomain)(),
    _ts_metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
let SendOtpDto = class SendOtpDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], SendOtpDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], SendOtpDto.prototype, "type", void 0);
let VerifyOtpDto = class VerifyOtpDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyOtpDto.prototype, "type", void 0);
let RefreshTokenDto = class RefreshTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
let ResetPasswordDto = class ResetPasswordDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "otp", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
let ChangePasswordDto = class ChangePasswordDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    _ts_metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
let GoogleAuthDto = class GoogleAuthDto {
    constructor(){
        this.role = _constants.UserRole.CANDIDATE;
    }
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GoogleAuthDto.prototype, "idToken", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_constants.UserRole),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _constants.UserRole === "undefined" ? Object : _constants.UserRole)
], GoogleAuthDto.prototype, "role", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GoogleAuthDto.prototype, "companyName", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], GoogleAuthDto.prototype, "designation", void 0);
let ForgotPasswordDto = class ForgotPasswordDto {
};
_ts_decorate([
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
let ResetPasswordWithTokenDto = class ResetPasswordWithTokenDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ResetPasswordWithTokenDto.prototype, "token", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    _ts_metadata("design:type", String)
], ResetPasswordWithTokenDto.prototype, "newPassword", void 0);

//# sourceMappingURL=auth.dto.js.map