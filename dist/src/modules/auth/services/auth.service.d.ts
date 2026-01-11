import { PrismaService } from '../../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto, ResetPasswordDto, ChangePasswordDto } from '../dto';
export declare class AuthService {
    private prisma;
    private otpService;
    private tokenService;
    constructor(prisma: PrismaService, otpService: OtpService, tokenService: TokenService);
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
            userId: string;
            updatedAt: Date;
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
            userId: string;
            updatedAt: Date;
            companyName: string;
            companyEmail: string;
            designation: string | null;
            employeeId: string | null;
            linkedinUrl: string | null;
            isVerified: boolean;
            verifiedAt: Date | null;
            referralCount: number;
            successfulReferrals: number;
            badges: string[];
            points: number;
        } | null;
        hr: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            companyName: string;
            companyEmail: string;
            designation: string | null;
            linkedinUrl: string | null;
            companyWebsite: string | null;
            approvalStatus: import("@prisma/client").$Enums.HRApprovalStatus;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectionReason: string | null;
            totalJobsPosted: number;
            activeJobs: number;
        } | null;
        id: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
}
