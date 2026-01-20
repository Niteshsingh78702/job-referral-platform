import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    IsPhoneNumber,
    IsEnum,
} from 'class-validator';
import { UserRole } from '../../../common/constants';
import { IsValidEmailDomain } from '../../../common/validators';

export class RegisterDto {
    @IsEmail({}, { message: 'Please enter a valid email address' })
    @IsValidEmailDomain()
    email: string;

    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.CANDIDATE;

    // For Employee/HR registration
    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsString()
    department?: string;
}

export class LoginDto {
    @IsEmail({}, { message: 'Please enter a valid email address' })
    @IsValidEmailDomain()
    email: string;

    @IsString()
    password: string;
}

export class SendOtpDto {
    @IsEmail()
    email: string;

    @IsString()
    type: 'email_verify' | 'phone_verify' | 'login' | 'password_reset';
}

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @IsString()
    otp: string;

    @IsString()
    type: 'email_verify' | 'phone_verify' | 'login' | 'password_reset';
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    otp: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

// Google OAuth
export class GoogleAuthDto {
    @IsString()
    idToken: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.CANDIDATE;

    // For Employee/HR registration via Google
    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    designation?: string;
}

// Forgot Password - Request reset link
export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

// Reset Password with Token (from email link)
export class ResetPasswordWithTokenDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

