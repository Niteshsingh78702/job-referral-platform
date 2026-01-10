"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const otp_service_1 = require("./otp.service");
const token_service_1 = require("./token.service");
const constants_1 = require("../../../common/constants");
let AuthService = class AuthService {
    prisma;
    otpService;
    tokenService;
    constructor(prisma, otpService, tokenService) {
        this.prisma = prisma;
        this.otpService = otpService;
        this.tokenService = tokenService;
    }
    async register(dto, deviceInfo) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('Phone number already registered');
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: dto.role || constants_1.UserRole.CANDIDATE,
                    status: constants_1.UserStatus.PENDING,
                },
            });
            if (user.role === constants_1.UserRole.CANDIDATE) {
                await tx.candidate.create({
                    data: {
                        userId: user.id,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                    },
                });
            }
            if (user.role === constants_1.UserRole.EMPLOYEE) {
                await tx.employee.create({
                    data: {
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                        isVerified: false,
                    },
                });
            }
            if (user.role === constants_1.UserRole.HR) {
                await tx.hR.create({
                    data: {
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                    },
                });
            }
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.CREATE,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: { registrationSource: 'email' },
                },
            });
            return user;
        });
        const payload = {
            sub: result.id,
            email: result.email,
            role: result.role,
        };
        return this.tokenService.generateTokenPair(payload);
    }
    async login(dto, deviceInfo) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                candidate: true,
                hr: true,
                employee: true,
            },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status === constants_1.UserStatus.BLOCKED) {
            throw new common_1.UnauthorizedException('Account is blocked');
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: constants_1.AuditAction.LOGIN,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: { ip: deviceInfo?.ip },
                },
            });
        });
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const token = await this.tokenService.generateTokenPair(payload);
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            token,
            user: userWithoutPassword,
        };
    }
    async sendOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (dto.type !== 'email_verify' && !user) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = this.otpService.generateOtp();
        const userId = user?.id || dto.email;
        await this.otpService.storeOtp(userId, dto.type, otp);
        if (user) {
            await this.prisma.oTPToken.create({
                data: {
                    userId: user.id,
                    otp,
                    type: dto.type,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                },
            });
        }
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${dto.email}: ${otp}`);
        }
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isValid = await this.otpService.verifyOtp(user.id, dto.type, dto.otp);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        await this.prisma.oTPToken.updateMany({
            where: {
                userId: user.id,
                otp: dto.otp,
                type: dto.type,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });
        if (dto.type === 'email_verify') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    status: constants_1.UserStatus.ACTIVE,
                },
            });
        }
        else if (dto.type === 'phone_verify') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            });
        }
        if (dto.type === 'login') {
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };
            return this.tokenService.generateTokenPair(payload);
        }
        return { message: 'OTP verified successfully' };
    }
    async refreshToken(dto) {
        const parts = dto.refreshToken.split('.');
        if (parts.length !== 3) {
            throw new common_1.UnauthorizedException('Invalid refresh token format');
        }
        const userId = parts[0];
        const isValid = await this.tokenService.validateRefreshToken(userId, dto.refreshToken);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.status === constants_1.UserStatus.BLOCKED) {
            throw new common_1.UnauthorizedException('User not found or blocked');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.tokenService.generateTokenPair(payload);
    }
    async logout(userId) {
        await this.tokenService.revokeRefreshToken(userId);
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: constants_1.AuditAction.LOGOUT,
                entityType: 'User',
                entityId: userId,
            },
        });
        return { message: 'Logged out successfully' };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isValid = await this.otpService.verifyOtp(user.id, 'password_reset', dto.otp);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        await this.tokenService.revokeRefreshToken(user.id);
        return { message: 'Password reset successfully' };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.BadRequestException('User not found');
        }
        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        return { message: 'Password changed successfully' };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                candidate: true,
                hr: true,
                employee: true,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        token_service_1.TokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map