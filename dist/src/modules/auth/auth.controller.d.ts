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
}
