import { UserRole } from '../../../common/constants';
export declare class RegisterDto {
    email: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    companyName?: string;
    designation?: string;
    department?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class SendOtpDto {
    email: string;
    type: 'email_verify' | 'phone_verify' | 'login' | 'password_reset';
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
    type: 'email_verify' | 'phone_verify' | 'login' | 'password_reset';
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
