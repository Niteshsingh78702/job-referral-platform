"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../../../prisma/prisma.service");
const _otpservice = require("./otp.service");
const _tokenservice = require("./token.service");
const _googleauthservice = require("./google-auth.service");
const _email = require("../../email");
const _constants = require("../../../common/constants");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuthService = class AuthService {
    // Register new user
    async register(dto, deviceInfo) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (existingUser) {
            throw new _common.ConflictException('Email already registered');
        }
        // Check phone if provided
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: {
                    phone: dto.phone
                }
            });
            if (existingPhone) {
                throw new _common.ConflictException('Phone number already registered');
            }
        }
        // Hash password
        const passwordHash = await _bcrypt.hash(dto.password, 12);
        // Create user and profile in transaction
        const result = await this.prisma.$transaction(async (tx)=>{
            const user = await tx.user.create({
                data: {
                    id: _crypto.randomUUID(),
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: dto.role || _constants.UserRole.CANDIDATE,
                    status: _constants.UserStatus.PENDING,
                    updatedAt: new Date()
                }
            });
            // Create candidate profile if role is CANDIDATE
            if (user.role === _constants.UserRole.CANDIDATE) {
                await tx.candidate.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        updatedAt: new Date()
                    }
                });
            }
            // Create employee profile if role is EMPLOYEE
            if (user.role === _constants.UserRole.EMPLOYEE) {
                await tx.employee.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                        isVerified: false,
                        updatedAt: new Date()
                    }
                });
            }
            // Create HR profile if role is HR
            if (user.role === _constants.UserRole.HR) {
                await tx.hR.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                        updatedAt: new Date()
                    }
                });
            }
            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent
                    }
                });
                // FRAUD DETECTION: Check for multi-account patterns
                await this.checkMultiAccountFraud(tx, user.id, deviceInfo);
            }
            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.CREATE,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: {
                        registrationSource: 'email'
                    }
                }
            });
            return user;
        });
        // Generate tokens
        const payload = {
            sub: result.id,
            email: result.email,
            role: result.role
        };
        return this.tokenService.generateTokenPair(payload);
    }
    // Login with email/password
    async login(dto, deviceInfo) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            },
            include: {
                Candidate: true,
                HR: true,
                Employee: true
            }
        });
        if (!user || !user.passwordHash) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        if (user.status === _constants.UserStatus.BLOCKED) {
            throw new _common.UnauthorizedException('Account is blocked');
        }
        // Verify password
        const isValid = await _bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        // Update last login
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLoginAt: new Date()
                }
            });
            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.LOGIN,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: {
                        ip: deviceInfo?.ip
                    }
                }
            });
        });
        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const token = await this.tokenService.generateTokenPair(payload);
        // Remove sensitive data from user
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            token,
            user: userWithoutPassword
        };
    }
    // Send OTP
    async sendOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        // For registration flow, user might not exist
        if (dto.type !== 'email_verify' && !user) {
            throw new _common.BadRequestException('User not found');
        }
        // Generate and store OTP
        const otp = this.otpService.generateOtp();
        const userId = user?.id || dto.email;
        await this.otpService.storeOtp(userId, dto.type, otp);
        // Store in database as well for tracking
        if (user) {
            await this.prisma.oTPToken.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    otp,
                    type: dto.type,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
                }
            });
        }
        // TODO: Send OTP via email/SMS
        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${dto.email}: ${otp}`);
        }
        return {
            message: 'OTP sent successfully'
        };
    }
    // Verify OTP
    async verifyOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) {
            throw new _common.BadRequestException('User not found');
        }
        // Verify OTP
        const isValid = await this.otpService.verifyOtp(user.id, dto.type, dto.otp);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid or expired OTP');
        }
        // Mark OTP as used in database
        await this.prisma.oTPToken.updateMany({
            where: {
                userId: user.id,
                otp: dto.otp,
                type: dto.type,
                usedAt: null
            },
            data: {
                usedAt: new Date()
            }
        });
        // Update user verification status
        if (dto.type === 'email_verify') {
            await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    emailVerified: true,
                    status: _constants.UserStatus.ACTIVE
                }
            });
        } else if (dto.type === 'phone_verify') {
            await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    phoneVerified: true
                }
            });
        }
        // For login OTP, return tokens
        if (dto.type === 'login') {
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            return this.tokenService.generateTokenPair(payload);
        }
        return {
            message: 'OTP verified successfully'
        };
    }
    // Refresh token
    async refreshToken(dto) {
        // Extract user ID from refresh token
        const parts = dto.refreshToken.split('.');
        if (parts.length !== 3) {
            throw new _common.UnauthorizedException('Invalid refresh token format');
        }
        const userId = parts[0];
        // Validate refresh token
        const isValid = await this.tokenService.validateRefreshToken(userId, dto.refreshToken);
        if (!isValid) {
            throw new _common.UnauthorizedException('Invalid or expired refresh token');
        }
        // Get user
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user || user.status === _constants.UserStatus.BLOCKED) {
            throw new _common.UnauthorizedException('User not found or blocked');
        }
        // Generate new token pair
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        return this.tokenService.generateTokenPair(payload);
    }
    // Logout
    async logout(userId) {
        await this.tokenService.revokeRefreshToken(userId);
        await this.prisma.auditLog.create({
            data: {
                id: _crypto.randomUUID(),
                userId,
                action: _constants.AuditAction.LOGOUT,
                entityType: 'User',
                entityId: userId
            }
        });
        return {
            message: 'Logged out successfully'
        };
    }
    // Reset password
    async resetPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) {
            throw new _common.BadRequestException('User not found');
        }
        // Verify OTP
        const isValid = await this.otpService.verifyOtp(user.id, 'password_reset', dto.otp);
        if (!isValid) {
            throw new _common.BadRequestException('Invalid or expired OTP');
        }
        // Update password
        const passwordHash = await _bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                passwordHash
            }
        });
        // Revoke all tokens
        await this.tokenService.revokeRefreshToken(user.id);
        return {
            message: 'Password reset successfully'
        };
    }
    // Change password
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user || !user.passwordHash) {
            throw new _common.BadRequestException('User not found');
        }
        // Verify current password
        const isValid = await _bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new _common.BadRequestException('Current password is incorrect');
        }
        // Update password
        const passwordHash = await _bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                passwordHash
            }
        });
        return {
            message: 'Password changed successfully'
        };
    }
    // Get current user
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                Candidate: true,
                HR: true,
                Employee: true
            }
        });
        if (!user) {
            throw new _common.BadRequestException('User not found');
        }
        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    // ==========================================
    // FORGOT PASSWORD / RESET WITH TOKEN
    // ==========================================
    // Request password reset (sends email with link)
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            },
            include: {
                Candidate: true
            }
        });
        // Always return success message to prevent email enumeration
        if (!user) {
            this.logger.log(`Password reset requested for non-existent email: ${dto.email}`);
            return {
                message: 'If an account exists with this email, you will receive a password reset link.'
            };
        }
        // Generate secure reset token
        const resetToken = _crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Delete any existing reset tokens for this user
        await this.prisma.passwordResetToken.deleteMany({
            where: {
                userId: user.id
            }
        });
        // Create new reset token
        await this.prisma.passwordResetToken.create({
            data: {
                id: _crypto.randomUUID(),
                userId: user.id,
                token: resetToken,
                expiresAt
            }
        });
        // Get user name for email
        const userName = user.Candidate?.firstName || 'User';
        // Send reset email
        await this.emailService.sendPasswordResetEmail(user.email, resetToken, userName);
        return {
            message: 'If an account exists with this email, you will receive a password reset link.'
        };
    }
    // Reset password with token (from email link)
    async resetPasswordWithToken(dto) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: {
                token: dto.token
            },
            include: {
                User: true
            }
        });
        if (!resetToken) {
            throw new _common.BadRequestException('Invalid or expired reset link');
        }
        if (resetToken.usedAt) {
            throw new _common.BadRequestException('This reset link has already been used');
        }
        if (new Date() > resetToken.expiresAt) {
            throw new _common.BadRequestException('This reset link has expired');
        }
        // Update password
        const passwordHash = await _bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: resetToken.userId
                },
                data: {
                    passwordHash
                }
            });
            // Mark token as used
            await tx.passwordResetToken.update({
                where: {
                    id: resetToken.id
                },
                data: {
                    usedAt: new Date()
                }
            });
        });
        // Revoke all refresh tokens for security
        await this.tokenService.revokeRefreshToken(resetToken.userId);
        return {
            message: 'Password reset successfully. Please login with your new password.'
        };
    }
    // ==========================================
    // GOOGLE OAUTH LOGIN
    // ==========================================
    async googleLogin(dto, deviceInfo) {
        // Verify Google token
        const googlePayload = await this.googleAuthService.verifyIdToken(dto.idToken);
        // Check if user exists by Google ID
        let user = await this.prisma.user.findUnique({
            where: {
                googleId: googlePayload.sub
            },
            include: {
                Candidate: true,
                HR: true,
                Employee: true
            }
        });
        let isNewUser = false;
        if (!user) {
            // Check if user exists by email (account linking)
            const existingEmailUser = await this.prisma.user.findUnique({
                where: {
                    email: googlePayload.email
                },
                include: {
                    Candidate: true,
                    HR: true,
                    Employee: true
                }
            });
            if (existingEmailUser) {
                // Link Google account to existing user
                user = await this.prisma.user.update({
                    where: {
                        id: existingEmailUser.id
                    },
                    data: {
                        googleId: googlePayload.sub,
                        authProvider: existingEmailUser.authProvider === 'email' ? 'email,google' : existingEmailUser.authProvider,
                        emailVerified: true
                    },
                    include: {
                        Candidate: true,
                        HR: true,
                        Employee: true
                    }
                });
                this.logger.log(`Linked Google account to existing user: ${user.email}`);
            } else {
                // Create new user with Google
                isNewUser = true;
                const role = dto.role || _constants.UserRole.CANDIDATE;
                user = await this.prisma.$transaction(async (tx)=>{
                    const newUser = await tx.user.create({
                        data: {
                            id: _crypto.randomUUID(),
                            email: googlePayload.email,
                            googleId: googlePayload.sub,
                            authProvider: 'google',
                            role,
                            status: _constants.UserStatus.ACTIVE,
                            emailVerified: true,
                            updatedAt: new Date()
                        }
                    });
                    // Create role-specific profile
                    if (role === _constants.UserRole.CANDIDATE) {
                        await tx.candidate.create({
                            data: {
                                id: _crypto.randomUUID(),
                                userId: newUser.id,
                                firstName: googlePayload.given_name || googlePayload.name?.split(' ')[0] || 'User',
                                lastName: googlePayload.family_name || googlePayload.name?.split(' ').slice(1).join(' ') || '',
                                avatarUrl: googlePayload.picture,
                                updatedAt: new Date()
                            }
                        });
                    } else if (role === _constants.UserRole.EMPLOYEE) {
                        await tx.employee.create({
                            data: {
                                id: _crypto.randomUUID(),
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                                updatedAt: new Date()
                            }
                        });
                    } else if (role === _constants.UserRole.HR) {
                        await tx.hR.create({
                            data: {
                                id: _crypto.randomUUID(),
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                                updatedAt: new Date()
                            }
                        });
                    }
                    // Audit log
                    await tx.auditLog.create({
                        data: {
                            id: _crypto.randomUUID(),
                            userId: newUser.id,
                            action: _constants.AuditAction.CREATE,
                            entityType: 'User',
                            entityId: newUser.id,
                            metadata: {
                                registrationSource: 'google'
                            }
                        }
                    });
                    return tx.user.findUnique({
                        where: {
                            id: newUser.id
                        },
                        include: {
                            Candidate: true,
                            HR: true,
                            Employee: true
                        }
                    });
                });
                // Send welcome email for new users
                const userName = googlePayload.given_name || googlePayload.name || 'there';
                await this.emailService.sendWelcomeEmail(googlePayload.email, userName);
            }
        }
        if (!user) {
            throw new _common.BadRequestException('Failed to create or find user');
        }
        // Update last login
        await this.prisma.$transaction(async (tx)=>{
            await tx.user.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLoginAt: new Date()
                }
            });
            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: _crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent
                    }
                });
            }
            // Audit log
            await tx.auditLog.create({
                data: {
                    id: _crypto.randomUUID(),
                    userId: user.id,
                    action: _constants.AuditAction.LOGIN,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: {
                        loginMethod: 'google'
                    }
                }
            });
        });
        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const token = await this.tokenService.generateTokenPair(payload);
        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            token,
            user: userWithoutPassword,
            isNewUser
        };
    }
    /**
     * FRAUD DETECTION: Check for multi-account patterns
     * Flags when same device ID or IP address is used to register multiple accounts
     */ async checkMultiAccountFraud(tx, userId, deviceInfo) {
        const deviceId = deviceInfo.deviceId || 'unknown';
        const ipAddress = deviceInfo.ip || 'unknown';
        // Skip checks for unknown values
        if (deviceId === 'unknown' && ipAddress === 'unknown') {
            return;
        }
        try {
            // Check for same device ID used by other accounts
            if (deviceId !== 'unknown') {
                const existingDeviceLogs = await tx.deviceLog.findMany({
                    where: {
                        deviceId,
                        userId: {
                            not: userId
                        }
                    },
                    distinct: [
                        'userId'
                    ],
                    take: 5
                });
                if (existingDeviceLogs.length > 0) {
                    const otherUserIds = existingDeviceLogs.map((log)=>log.userId);
                    await tx.suspiciousActivity.create({
                        data: {
                            id: _crypto.randomUUID(),
                            userId,
                            activityType: 'MULTI_ACCOUNT_DEVICE',
                            severity: existingDeviceLogs.length >= 3 ? 'HIGH' : 'MEDIUM',
                            deviceId,
                            ipAddress,
                            details: {
                                otherAccountsCount: existingDeviceLogs.length,
                                otherUserIds,
                                message: `Device ${deviceId} was used to register ${existingDeviceLogs.length + 1} accounts`
                            }
                        }
                    });
                    this.logger.warn(`FRAUD ALERT: Multi-account detected on device ${deviceId}. ` + `User ${userId} shares device with ${existingDeviceLogs.length} other accounts.`);
                }
            }
            // Check for same IP used by multiple accounts recently (last 24h)
            if (ipAddress !== 'unknown') {
                const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const existingIpLogs = await tx.deviceLog.findMany({
                    where: {
                        ipAddress,
                        userId: {
                            not: userId
                        },
                        createdAt: {
                            gte: recentDate
                        }
                    },
                    distinct: [
                        'userId'
                    ],
                    take: 5
                });
                if (existingIpLogs.length >= 2) {
                    const otherUserIds = existingIpLogs.map((log)=>log.userId);
                    await tx.suspiciousActivity.create({
                        data: {
                            id: _crypto.randomUUID(),
                            userId,
                            activityType: 'MULTI_ACCOUNT_IP',
                            severity: existingIpLogs.length >= 5 ? 'HIGH' : 'LOW',
                            deviceId,
                            ipAddress,
                            details: {
                                otherAccountsCount: existingIpLogs.length,
                                otherUserIds,
                                timeWindow: '24h',
                                message: `IP ${ipAddress} registered ${existingIpLogs.length + 1} accounts in last 24 hours`
                            }
                        }
                    });
                    this.logger.warn(`FRAUD ALERT: Rapid registrations from IP ${ipAddress}. ` + `${existingIpLogs.length + 1} accounts in 24h.`);
                }
            }
        } catch (error) {
            // Don't block registration if fraud check fails
            this.logger.error('Fraud check failed', error);
        }
    }
    constructor(prisma, otpService, tokenService, googleAuthService, emailService){
        this.prisma = prisma;
        this.otpService = otpService;
        this.tokenService = tokenService;
        this.googleAuthService = googleAuthService;
        this.emailService = emailService;
        this.logger = new _common.Logger(AuthService.name);
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _otpservice.OtpService === "undefined" ? Object : _otpservice.OtpService,
        typeof _tokenservice.TokenService === "undefined" ? Object : _tokenservice.TokenService,
        typeof _googleauthservice.GoogleAuthService === "undefined" ? Object : _googleauthservice.GoogleAuthService,
        typeof _email.EmailService === "undefined" ? Object : _email.EmailService
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map