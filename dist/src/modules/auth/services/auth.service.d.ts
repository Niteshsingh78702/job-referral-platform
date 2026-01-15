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
        candidate: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            firstName: string;
            lastName: string;
            headline: string | null;
            bio: string | null;
            avatarUrl: string | null;
            resumeUrl: string | null;
            totalExperience: number | null;
            currentCompany: string | null;
            currentRole: string | null;
            expectedSalary: number | null;
            noticePeriod: number | null;
            city: string | null;
            state: string | null;
            country: string | null;
            willingToRelocate: boolean;
        } | null;
        employee: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string | null;
            companyName: string;
            userId: string;
            companyEmail: string;
            designation: string | null;
            linkedinUrl: string | null;
            points: number;
            isVerified: boolean;
            verifiedAt: Date | null;
            referralCount: number;
            successfulReferrals: number;
            badges: string[];
        } | null;
        hr: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyName: string;
            userId: string;
            companyEmail: string;
            companyWebsite: string | null;
            designation: string | null;
            linkedinUrl: string | null;
            approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectionReason: string | null;
            totalJobsPosted: number;
            activeJobs: number;
        } | null;
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerified: boolean;
        phoneVerified: boolean;
        googleId: string | null;
        authProvider: string;
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
