import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_KEYS } from '../../../common/constants';

@Injectable()
export class OtpService {
    private redis: Redis | null = null;
    private readonly logger = new Logger(OtpService.name);
    private otpExpiry: number;
    private otpLength: number;
    // In-memory fallback
    private otpStore: Map<string, { otp: string; expiry: number }> = new Map();

    constructor(private configService: ConfigService) {
        this.otpExpiry = this.configService.get('OTP_EXPIRY_MINUTES', 10) * 60;
        this.otpLength = this.configService.get('OTP_LENGTH', 6);
        this.initRedis();
    }

    private initRedis(): void {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');

        if (redisUrl || redisHost) {
            try {
                if (redisUrl) {
                    this.redis = new Redis(redisUrl);
                } else {
                    this.redis = new Redis({
                        host: redisHost || 'localhost',
                        port: this.configService.get('REDIS_PORT', 6379),
                        password: this.configService.get('REDIS_PASSWORD'),
                    });
                }

                this.redis.on('error', (err) => {
                    this.logger.warn(`Redis error: ${err.message}. Using in-memory.`);
                    this.redis = null;
                });
            } catch {
                this.logger.warn('Redis not available. Using in-memory OTP storage.');
            }
        }
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

    // Store OTP
    async storeOtp(userId: string, type: string, otp: string): Promise<void> {
        const key = REDIS_KEYS.OTP(userId, type);

        if (this.redis) {
            try {
                await this.redis.set(key, otp, 'EX', this.otpExpiry);
                return;
            } catch {
                // Fall through to in-memory
            }
        }

        this.otpStore.set(key, {
            otp,
            expiry: Date.now() + (this.otpExpiry * 1000)
        });
    }

    // Verify OTP
    async verifyOtp(userId: string, type: string, otp: string): Promise<boolean> {
        const key = REDIS_KEYS.OTP(userId, type);

        if (this.redis) {
            try {
                const storedOtp = await this.redis.get(key);
                if (!storedOtp || storedOtp !== otp) {
                    return false;
                }
                await this.redis.del(key);
                return true;
            } catch {
                // Fall through to in-memory
            }
        }

        const stored = this.otpStore.get(key);
        if (!stored || stored.otp !== otp) {
            return false;
        }
        if (Date.now() > stored.expiry) {
            this.otpStore.delete(key);
            return false;
        }
        this.otpStore.delete(key);
        return true;
    }

    // Invalidate OTP
    async invalidateOtp(userId: string, type: string): Promise<void> {
        const key = REDIS_KEYS.OTP(userId, type);

        if (this.redis) {
            try {
                await this.redis.del(key);
            } catch {
                this.otpStore.delete(key);
            }
        } else {
            this.otpStore.delete(key);
        }
    }

    // Check if OTP exists
    async hasOtp(userId: string, type: string): Promise<boolean> {
        const key = REDIS_KEYS.OTP(userId, type);

        if (this.redis) {
            try {
                const exists = await this.redis.exists(key);
                return exists === 1;
            } catch {
                // Fall through
            }
        }

        const stored = this.otpStore.get(key);
        if (!stored) return false;
        if (Date.now() > stored.expiry) {
            this.otpStore.delete(key);
            return false;
        }
        return true;
    }
}
