import { PrismaService } from '../../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { EmailService } from '../../email';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto, ResetPasswordDto, ChangePasswordDto, GoogleAuthDto, ForgotPasswordDto, ResetPasswordWithTokenDto } from '../dto';
export declare class AuthService {
    private prisma;
    private otpService;
    private tokenService;
    private googleAuthService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, otpService: OtpService, tokenService: TokenService, googleAuthService: GoogleAuthService, emailService: EmailService);
    register(dto: RegisterDto, deviceInfo?: any): Promise<TokenPair>;
    login(dto: LoginDto, deviceInfo?: any): Promise<{
        token: TokenPair;
        user: any;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<TokenPair | {
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<TokenPair>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        id: string;
        email: string;
        phone: string | null;
        googleId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        authProvider: string;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPasswordWithToken(dto: ResetPasswordWithTokenDto): Promise<{
        message: string;
    }>;
    googleLogin(dto: GoogleAuthDto, deviceInfo?: any): Promise<{
        token: TokenPair;
        user: any;
        isNewUser: boolean;
    }>;
}
