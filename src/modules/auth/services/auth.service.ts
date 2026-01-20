import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair, JwtPayload } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { EmailService } from '../../email';
import {
    RegisterDto,
    LoginDto,
    SendOtpDto,
    VerifyOtpDto,
    RefreshTokenDto,
    ResetPasswordDto,
    ChangePasswordDto,
    GoogleAuthDto,
    ForgotPasswordDto,
    ResetPasswordWithTokenDto,
} from '../dto';
import { UserRole, UserStatus, AuditAction } from '../../../common/constants';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private otpService: OtpService,
        private tokenService: TokenService,
        private googleAuthService: GoogleAuthService,
        private emailService: EmailService,
    ) { }

    // Register new user
    async register(dto: RegisterDto, deviceInfo?: any): Promise<{ token: TokenPair; user: any }> {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Check phone if provided
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new ConflictException('Phone number already registered');
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Create user and profile in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: dto.role || UserRole.CANDIDATE,
                    status: UserStatus.PENDING,
                    updatedAt: new Date(),
                },
            });

            // Create candidate profile if role is CANDIDATE
            if (user.role === UserRole.CANDIDATE) {
                await tx.candidate.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        updatedAt: new Date(),
                    },
                });
            }

            // Create employee profile if role is EMPLOYEE
            if (user.role === UserRole.EMPLOYEE) {
                await tx.employee.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                        isVerified: false,
                        updatedAt: new Date(),
                    },
                });
            }

            // Create HR profile if role is HR
            if (user.role === UserRole.HR) {
                await tx.hR.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                        updatedAt: new Date(),
                    },
                });
            }

            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });

                // FRAUD DETECTION: Check for multi-account patterns
                await this.checkMultiAccountFraud(tx, user.id, deviceInfo);
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    action: AuditAction.CREATE,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: { registrationSource: 'email' },
                },
            });

            return user;
        });

        // Fetch the full user with profile data
        const fullUser = await this.prisma.user.findUnique({
            where: { id: result.id },
            include: {
                Candidate: true,
                HR: true,
                Employee: true,
            },
        });

        // Generate tokens
        const payload: JwtPayload = {
            sub: result.id,
            email: result.email,
            role: result.role,
        };

        const token = await this.tokenService.generateTokenPair(payload);

        // Build user response with profile data for frontend
        const userResponse = {
            id: result.id,
            email: result.email,
            role: result.role,
            status: result.status,
            firstName: dto.firstName || fullUser?.Candidate?.firstName,
            lastName: dto.lastName || fullUser?.Candidate?.lastName,
        };

        return {
            token,
            user: userResponse,
        };
    }

    // Login with email/password
    async login(dto: LoginDto, deviceInfo?: any): Promise<{ token: TokenPair; user: any }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                Candidate: true,
                HR: true,
                Employee: true,
            },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedException('Account is blocked');
        }

        // Verify password
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    action: AuditAction.LOGIN,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: { ip: deviceInfo?.ip },
                },
            });
        });

        // Generate tokens
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const token = await this.tokenService.generateTokenPair(payload);

        // Remove sensitive data from user
        const { passwordHash, ...userWithoutPassword } = user;

        return {
            token,
            user: userWithoutPassword,
        };
    }

    // Send OTP
    async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // For registration flow, user might not exist
        if (dto.type !== 'email_verify' && !user) {
            throw new BadRequestException('User not found');
        }

        // Generate and store OTP
        const otp = this.otpService.generateOtp();
        const userId = user?.id || dto.email;
        await this.otpService.storeOtp(userId, dto.type, otp);

        // Store in database as well for tracking
        if (user) {
            await this.prisma.oTPToken.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    otp,
                    type: dto.type,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                },
            });
        }

        // TODO: Send OTP via email/SMS
        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${dto.email}: ${otp}`);
        }

        return { message: 'OTP sent successfully' };
    }

    // Verify OTP
    async verifyOtp(dto: VerifyOtpDto): Promise<TokenPair | { message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify OTP
        const isValid = await this.otpService.verifyOtp(user.id, dto.type, dto.otp);
        if (!isValid) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Mark OTP as used in database
        await this.prisma.oTPToken.updateMany({
            where: {
                userId: user.id,
                otp: dto.otp,
                type: dto.type,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });

        // Update user verification status
        if (dto.type === 'email_verify') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    status: UserStatus.ACTIVE,
                },
            });
        } else if (dto.type === 'phone_verify') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            });
        }

        // For login OTP, return tokens
        if (dto.type === 'login') {
            const payload: JwtPayload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };
            return this.tokenService.generateTokenPair(payload);
        }

        return { message: 'OTP verified successfully' };
    }

    // Refresh token
    async refreshToken(dto: RefreshTokenDto): Promise<TokenPair> {
        // Extract user ID from refresh token
        const parts = dto.refreshToken.split('.');
        if (parts.length !== 3) {
            throw new UnauthorizedException('Invalid refresh token format');
        }

        const userId = parts[0];

        // Validate refresh token
        const isValid = await this.tokenService.validateRefreshToken(
            userId,
            dto.refreshToken,
        );

        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Get user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedException('User not found or blocked');
        }

        // Generate new token pair
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.tokenService.generateTokenPair(payload);
    }

    // Logout
    async logout(userId: string): Promise<{ message: string }> {
        await this.tokenService.revokeRefreshToken(userId);

        await this.prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                action: AuditAction.LOGOUT,
                entityType: 'User',
                entityId: userId,
            },
        });

        return { message: 'Logged out successfully' };
    }

    // Reset password
    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify OTP
        const isValid = await this.otpService.verifyOtp(
            user.id,
            'password_reset',
            dto.otp,
        );
        if (!isValid) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Update password
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Revoke all tokens
        await this.tokenService.revokeRefreshToken(user.id);

        return { message: 'Password reset successfully' };
    }

    // Change password
    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.passwordHash) {
            throw new BadRequestException('User not found');
        }

        // Verify current password
        const isValid = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Update password
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: 'Password changed successfully' };
    }

    // Get current user
    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                Candidate: true,
                HR: true,
                Employee: true,
            },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // ==========================================
    // FORGOT PASSWORD / RESET WITH TOKEN
    // ==========================================

    // Request password reset (sends email with link)
    async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { Candidate: true },
        });

        // Always return success message to prevent email enumeration
        if (!user) {
            this.logger.log(`Password reset requested for non-existent email: ${dto.email}`);
            return { message: 'If an account exists with this email, you will receive a password reset link.' };
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete any existing reset tokens for this user
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Create new reset token
        await this.prisma.passwordResetToken.create({
            data: {
                id: crypto.randomUUID(),
                userId: user.id,
                token: resetToken,
                expiresAt,
            },
        });

        // Get user name for email
        const userName = user.Candidate?.firstName || 'User';

        // Send reset email
        await this.emailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            userName,
        );

        return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    // Reset password with token (from email link)
    async resetPasswordWithToken(dto: ResetPasswordWithTokenDto): Promise<{ message: string }> {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token: dto.token },
            include: { User: true },
        });

        if (!resetToken) {
            throw new BadRequestException('Invalid or expired reset link');
        }

        if (resetToken.usedAt) {
            throw new BadRequestException('This reset link has already been used');
        }

        if (new Date() > resetToken.expiresAt) {
            throw new BadRequestException('This reset link has expired');
        }

        // Update password
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            });

            // Mark token as used
            await tx.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            });
        });

        // Revoke all refresh tokens for security
        await this.tokenService.revokeRefreshToken(resetToken.userId);

        return { message: 'Password reset successfully. Please login with your new password.' };
    }

    // ==========================================
    // GOOGLE OAUTH LOGIN
    // ==========================================

    async googleLogin(dto: GoogleAuthDto, deviceInfo?: any): Promise<{ token: TokenPair; user: any; isNewUser: boolean }> {
        // Verify Google token
        const googlePayload = await this.googleAuthService.verifyIdToken(dto.idToken);

        // Check if user exists by Google ID
        let user = await this.prisma.user.findUnique({
            where: { googleId: googlePayload.sub },
            include: {
                Candidate: true,
                HR: true,
                Employee: true,
            },
        });

        let isNewUser = false;

        if (!user) {
            // Check if user exists by email (account linking)
            const existingEmailUser = await this.prisma.user.findUnique({
                where: { email: googlePayload.email },
                include: {
                    Candidate: true,
                    HR: true,
                    Employee: true,
                },
            });

            if (existingEmailUser) {
                // Link Google account to existing user
                user = await this.prisma.user.update({
                    where: { id: existingEmailUser.id },
                    data: {
                        googleId: googlePayload.sub,
                        authProvider: existingEmailUser.authProvider === 'email' ? 'email,google' : existingEmailUser.authProvider,
                        emailVerified: true, // Google verifies email
                    },
                    include: {
                        Candidate: true,
                        HR: true,
                        Employee: true,
                    },
                });
                this.logger.log(`Linked Google account to existing user: ${user.email}`);
            } else {
                // Create new user with Google
                isNewUser = true;
                const role = dto.role || UserRole.CANDIDATE;

                user = await this.prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            id: crypto.randomUUID(),
                            email: googlePayload.email,
                            googleId: googlePayload.sub,
                            authProvider: 'google',
                            role,
                            status: UserStatus.ACTIVE, // Google users are auto-verified
                            emailVerified: true,
                            updatedAt: new Date(),
                        },
                    });

                    // Create role-specific profile
                    if (role === UserRole.CANDIDATE) {
                        await tx.candidate.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: newUser.id,
                                firstName: googlePayload.given_name || googlePayload.name?.split(' ')[0] || 'User',
                                lastName: googlePayload.family_name || googlePayload.name?.split(' ').slice(1).join(' ') || '',
                                avatarUrl: googlePayload.picture,
                                updatedAt: new Date(),
                            },
                        });
                    } else if (role === UserRole.EMPLOYEE) {
                        await tx.employee.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                                updatedAt: new Date(),
                            },
                        });
                    } else if (role === UserRole.HR) {
                        await tx.hR.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: newUser.id,
                                companyName: dto.companyName || 'Unknown Company',
                                companyEmail: googlePayload.email,
                                designation: dto.designation,
                                updatedAt: new Date(),
                            },
                        });
                    }

                    // Audit log
                    await tx.auditLog.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId: newUser.id,
                            action: AuditAction.CREATE,
                            entityType: 'User',
                            entityId: newUser.id,
                            metadata: { registrationSource: 'google' },
                        },
                    });

                    return tx.user.findUnique({
                        where: { id: newUser.id },
                        include: {
                            Candidate: true,
                            HR: true,
                            Employee: true,
                        },
                    });
                });

                // Send welcome email for new users
                const userName = googlePayload.given_name || googlePayload.name || 'there';
                await this.emailService.sendWelcomeEmail(googlePayload.email, userName);
            }
        }

        if (!user) {
            throw new BadRequestException('Failed to create or find user');
        }

        // Update last login
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user!.id },
                data: { lastLoginAt: new Date() },
            });

            // Log device
            if (deviceInfo) {
                await tx.deviceLog.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: user!.id,
                        deviceId: deviceInfo.deviceId || 'unknown',
                        ipAddress: deviceInfo.ip || 'unknown',
                        userAgent: deviceInfo.userAgent,
                    },
                });
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user!.id,
                    action: AuditAction.LOGIN,
                    entityType: 'User',
                    entityId: user!.id,
                    metadata: { loginMethod: 'google' },
                },
            });
        });

        // Generate tokens
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const token = await this.tokenService.generateTokenPair(payload);

        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;

        return {
            token,
            user: userWithoutPassword,
            isNewUser,
        };
    }

    /**
     * FRAUD DETECTION: Check for multi-account patterns
     * Flags when same device ID or IP address is used to register multiple accounts
     */
    private async checkMultiAccountFraud(tx: any, userId: string, deviceInfo: any): Promise<void> {
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
                        userId: { not: userId },
                    },
                    distinct: ['userId'],
                    take: 5,
                });

                if (existingDeviceLogs.length > 0) {
                    const otherUserIds = existingDeviceLogs.map((log: any) => log.userId);
                    await tx.suspiciousActivity.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId,
                            activityType: 'MULTI_ACCOUNT_DEVICE',
                            severity: existingDeviceLogs.length >= 3 ? 'HIGH' : 'MEDIUM',
                            deviceId,
                            ipAddress,
                            details: {
                                otherAccountsCount: existingDeviceLogs.length,
                                otherUserIds,
                                message: `Device ${deviceId} was used to register ${existingDeviceLogs.length + 1} accounts`,
                            },
                        },
                    });
                    this.logger.warn(
                        `FRAUD ALERT: Multi-account detected on device ${deviceId}. ` +
                        `User ${userId} shares device with ${existingDeviceLogs.length} other accounts.`
                    );
                }
            }

            // Check for same IP used by multiple accounts recently (last 24h)
            if (ipAddress !== 'unknown') {
                const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const existingIpLogs = await tx.deviceLog.findMany({
                    where: {
                        ipAddress,
                        userId: { not: userId },
                        createdAt: { gte: recentDate },
                    },
                    distinct: ['userId'],
                    take: 5,
                });

                if (existingIpLogs.length >= 2) {
                    const otherUserIds = existingIpLogs.map((log: any) => log.userId);
                    await tx.suspiciousActivity.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId,
                            activityType: 'MULTI_ACCOUNT_IP',
                            severity: existingIpLogs.length >= 5 ? 'HIGH' : 'LOW',
                            deviceId,
                            ipAddress,
                            details: {
                                otherAccountsCount: existingIpLogs.length,
                                otherUserIds,
                                timeWindow: '24h',
                                message: `IP ${ipAddress} registered ${existingIpLogs.length + 1} accounts in last 24 hours`,
                            },
                        },
                    });
                    this.logger.warn(
                        `FRAUD ALERT: Rapid registrations from IP ${ipAddress}. ` +
                        `${existingIpLogs.length + 1} accounts in 24h.`
                    );
                }
            }
        } catch (error) {
            // Don't block registration if fraud check fails
            this.logger.error('Fraud check failed', error);
        }
    }
}
