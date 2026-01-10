import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair, JwtPayload } from './token.service';
import {
    RegisterDto,
    LoginDto,
    SendOtpDto,
    VerifyOtpDto,
    RefreshTokenDto,
    ResetPasswordDto,
    ChangePasswordDto,
} from '../dto';
import { UserRole, UserStatus, AuditAction } from '../../../common/constants';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private otpService: OtpService,
        private tokenService: TokenService,
    ) { }

    // Register new user
    async register(dto: RegisterDto, deviceInfo?: any): Promise<TokenPair> {
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
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    role: dto.role || UserRole.CANDIDATE,
                    status: UserStatus.PENDING,
                },
            });

            // Create candidate profile if role is CANDIDATE
            if (user.role === UserRole.CANDIDATE) {
                await tx.candidate.create({
                    data: {
                        userId: user.id,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                    },
                });
            }

            // Create employee profile if role is EMPLOYEE
            if (user.role === UserRole.EMPLOYEE) {
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

            // Create HR profile if role is HR
            if (user.role === UserRole.HR) {
                await tx.hR.create({
                    data: {
                        userId: user.id,
                        companyName: dto.companyName || 'Unknown Company',
                        companyEmail: dto.email,
                        designation: dto.designation,
                    },
                });
            }

            // Log device
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

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: AuditAction.CREATE,
                    entityType: 'User',
                    entityId: user.id,
                    metadata: { registrationSource: 'email' },
                },
            });

            return user;
        });

        // Generate tokens
        const payload: JwtPayload = {
            sub: result.id,
            email: result.email,
            role: result.role,
        };

        return this.tokenService.generateTokenPair(payload);
    }

    // Login with email/password
    async login(dto: LoginDto, deviceInfo?: any): Promise<{ token: TokenPair; user: any }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                candidate: true,
                hr: true,
                employee: true,
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
                candidate: true,
                hr: true,
                employee: true,
            },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
