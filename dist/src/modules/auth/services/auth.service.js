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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const otp_service_1 = require("./otp.service");
const token_service_1 = require("./token.service");
const google_auth_service_1 = require("./google-auth.service");
const email_1 = require("../../email");
const constants_1 = require("../../../common/constants");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    otpService;
    tokenService;
    googleAuthService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, otpService, tokenService, googleAuthService, emailService) {
        this.prisma = prisma;
        this.otpService = otpService;
        this.tokenService = tokenService;
        this.googleAuthService = googleAuthService;
        this.emailService = emailService;
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
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { candidate: true },
        });
        if (!user) {
            this.logger.log(`Password reset requested for non-existent email: ${dto.email}`);
            return { message: 'If an account exists with this email, you will receive a password reset link.' };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt,
            },
        });
        const userName = user.candidate?.firstName || 'User';
        await this.emailService.sendPasswordResetEmail(user.email, resetToken, userName);
        return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }
    async resetPasswordWithToken(dto) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token: dto.token },
            include: { user: true },
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid or expired reset link');
        }
        if (resetToken.usedAt) {
            throw new common_1.BadRequestException('This reset link has already been used');
        }
        if (new Date() > resetToken.expiresAt) {
            throw new common_1.BadRequestException('This reset link has expired');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            });
            await tx.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            });
        });
        await this.tokenService.revokeRefreshToken(resetToken.userId);
        return { message: 'Password reset successfully. Please login with your new password.' };
    }
    async googleLogin(dto, deviceInfo) {
        const googlePayload = await this.googleAuthService.verifyIdToken(dto.idToken);
        let user = await this.prisma.user.findUnique({
            where: { googleId: googlePayload.sub },
            include: {
                candidate: true,
                hr: true,
                employee: true,
            },
        });
        let isNewUser = false;
        if (!user) {
            const existingEmailUser = await this.prisma.user.findUnique({
                where: { email: googlePayload.email },
                include: {
                    candidate: true,
                    hr: true,
                    employee: true,
                },
            });
            if (existingEmailUser) {
                user = await this.prisma.user.update({
                    where: { id: existingEmailUser.id },
                    data: {
                        googleId: googlePayload.sub,
                        authProvider: existingEmailUser.authProvider === 'email' ? 'email,google' : existingEmailUser.authProvider,
                        emailVerified: true,
                    },
                    include: {
                        candidate: true,
                        hr: true,
                        employee: true,
                    },
                });
                this.logger.log(`Linked Google account to existing user: ${user.email}`);
            }
            else {
                isNewUser = true;
                const role = dto.role || constants_1.UserRole.CANDIDATE;
                user = await this.prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            email: googlePayload.email,
                            googleId: googlePayload.sub,
                            authProvider: 'google',
                            role,
                            status: constants_1.UserStatus.ACTIVE,
                            emailVerified: true,
                        },
                    });
                    if (role === constants_1.UserRole.CANDIDATE) {
                        await tx.candidate.create({
                            data: {
                                userId: newUser.id,
                                firstName: googlePayload.given_name || googlePayload.name?.split(' ')[0] || 'User',
                                lastName: googlePayload.family_name || googlePayload.name?.split(' ').slice(1).join(' ') || '',
                                avatarUrl: googlePayload.picture,
                            },
                        });
                    }
                    else if (role === constants_1.UserRole.EMPLOYEE) {
                        await tx.employee.create({
                            data: {
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                            },
                        });
                    }
                    else if (role === constants_1.UserRole.HR) {
                        await tx.hR.create({
                            data: {
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                            },
                        });
                    }
                    await tx.auditLog.create({
                        data: {
                            userId: newUser.id,
                            action: constants_1.AuditAction.CREATE,
                            entityType: 'User',
                            entityId: newUser.id,
                            metadata: { registrationSource: 'google' },
                        },
                    });
                    return tx.user.findUnique({
                        where: { id: newUser.id },
                        include: {
                            candidate: true,
                            hr: true,
                            employee: true,
                        },
                    });
                });
                const userName = googlePayload.given_name || googlePayload.name || 'there';
                await this.emailService.sendWelcomeEmail(googlePayload.email, userName);
            }
        }
        if (!user) {
            throw new common_1.BadRequestException('Failed to create or find user');
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
                    metadata: { loginMethod: 'google' },
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
            isNewUser,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        token_service_1.TokenService,
        google_auth_service_1.GoogleAuthService,
        email_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map