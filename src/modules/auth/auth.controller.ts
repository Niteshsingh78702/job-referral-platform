import {
    Controller,
    Post,
    Body,
    Get,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './services';
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
} from './dto';
import { Public, CurrentUser } from '../../common/decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto, @Req() req: any) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.authService.register(dto, deviceInfo);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: any) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.authService.login(dto, deviceInfo);
    }

    @Public()
    @Post('google')
    @HttpCode(HttpStatus.OK)
    async googleLogin(@Body() dto: GoogleAuthDto, @Req() req: any) {
        const deviceInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        return this.authService.googleLogin(dto, deviceInfo);
    }

    @Public()
    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto);
    }

    @Public()
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser('sub') userId: string) {
        return this.authService.logout(userId);
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Public()
    @Post('reset-password-with-token')
    @HttpCode(HttpStatus.OK)
    async resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
        return this.authService.resetPasswordWithToken(dto);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('sub') userId: string,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(userId, dto);
    }

    @Get('me')
    async getCurrentUser(@CurrentUser('sub') userId: string) {
        return this.authService.getCurrentUser(userId);
    }
}

