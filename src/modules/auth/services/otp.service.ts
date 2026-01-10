import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_KEYS } from '../../../common/constants';

@Injectable()
export class OtpService {
    private redis: Redis;
    private otpExpiry: number;
    private otpLength: number;

    constructor(private configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
        });
        this.otpExpiry = this.configService.get('OTP_EXPIRY_MINUTES', 10) * 60;
        this.otpLength = this.configService.get('OTP_LENGTH', 6);
    }

    // Generate OTP
    generateOtp(): string {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < this.otpLength; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    // Store OTP in Redis
    async storeOtp(userId: string, type: string, otp: string): Promise<void> {
        const key = REDIS_KEYS.OTP(userId, type);
        await this.redis.set(key, otp, 'EX', this.otpExpiry);
    }

    // Verify OTP
    async verifyOtp(userId: string, type: string, otp: string): Promise<boolean> {
        const key = REDIS_KEYS.OTP(userId, type);
        const storedOtp = await this.redis.get(key);

        if (!storedOtp || storedOtp !== otp) {
            return false;
        }

        // Delete OTP after successful verification
        await this.redis.del(key);
        return true;
    }

    // Invalidate OTP
    async invalidateOtp(userId: string, type: string): Promise<void> {
        const key = REDIS_KEYS.OTP(userId, type);
        await this.redis.del(key);
    }

    // Check if OTP exists
    async hasOtp(userId: string, type: string): Promise<boolean> {
        const key = REDIS_KEYS.OTP(userId, type);
        const exists = await this.redis.exists(key);
        return exists === 1;
    }
}
