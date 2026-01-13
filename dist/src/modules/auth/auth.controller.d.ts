import { AuthService } from './services';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto, ResetPasswordDto, ChangePasswordDto, GoogleAuthDto, ForgotPasswordDto, ResetPasswordWithTokenDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: any): Promise<import("./services").TokenPair>;
    login(dto: LoginDto, req: any): Promise<{
        token: import("./services").TokenPair;
        user: any;
    }>;
    googleLogin(dto: GoogleAuthDto, req: any): Promise<{
        token: import("./services").TokenPair;
        user: any;
        isNewUser: boolean;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<import("./services").TokenPair | {
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<import("./services").TokenPair>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    resetPasswordWithToken(dto: ResetPasswordWithTokenDto): Promise<{
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
        hr: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
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
        employee: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            companyEmail: string;
            designation: string | null;
            linkedinUrl: string | null;
            points: number;
            employeeId: string | null;
            isVerified: boolean;
            verifiedAt: Date | null;
            referralCount: number;
            successfulReferrals: number;
            badges: string[];
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        phone: string | null;
        googleId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerified: boolean;
        phoneVerified: boolean;
        authProvider: string;
        lastLoginAt: Date | null;
    }>;
}
