import { ConfigService } from '@nestjs/config';
export declare class OtpService {
    private configService;
    private redis;
    private readonly logger;
    private otpExpiry;
    private otpLength;
    private otpStore;
    constructor(configService: ConfigService);
    private initRedis;
    generateOtp(): string;
    storeOtp(userId: string, type: string, otp: string): Promise<void>;
    verifyOtp(userId: string, type: string, otp: string): Promise<boolean>;
    invalidateOtp(userId: string, type: string): Promise<void>;
    hasOtp(userId: string, type: string): Promise<boolean>;
}
