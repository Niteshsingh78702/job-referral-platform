"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const constants_1 = require("../../../common/constants");
let OtpService = OtpService_1 = class OtpService {
    configService;
    redis = null;
    logger = new common_1.Logger(OtpService_1.name);
    otpExpiry;
    otpLength;
    otpStore = new Map();
    constructor(configService) {
        this.configService = configService;
        this.otpExpiry = this.configService.get('OTP_EXPIRY_MINUTES', 10) * 60;
        this.otpLength = this.configService.get('OTP_LENGTH', 6);
        this.initRedis();
    }
    initRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');
        if (redisUrl || redisHost) {
            try {
                if (redisUrl) {
                    this.redis = new ioredis_1.default(redisUrl);
                }
                else {
                    this.redis = new ioredis_1.default({
                        host: redisHost || 'localhost',
                        port: this.configService.get('REDIS_PORT', 6379),
                        password: this.configService.get('REDIS_PASSWORD'),
                    });
                }
                this.redis.on('error', (err) => {
                    this.logger.warn(`Redis error: ${err.message}. Using in-memory.`);
                    this.redis = null;
                });
            }
            catch {
                this.logger.warn('Redis not available. Using in-memory OTP storage.');
            }
        }
    }
    generateOtp() {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < this.otpLength; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
    async storeOtp(userId, type, otp) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                await this.redis.set(key, otp, 'EX', this.otpExpiry);
                return;
            }
            catch {
            }
        }
        this.otpStore.set(key, {
            otp,
            expiry: Date.now() + (this.otpExpiry * 1000)
        });
    }
    async verifyOtp(userId, type, otp) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                const storedOtp = await this.redis.get(key);
                if (!storedOtp || storedOtp !== otp) {
                    return false;
                }
                await this.redis.del(key);
                return true;
            }
            catch {
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
    async invalidateOtp(userId, type) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                await this.redis.del(key);
            }
            catch {
                this.otpStore.delete(key);
            }
        }
        else {
            this.otpStore.delete(key);
        }
    }
    async hasOtp(userId, type) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                const exists = await this.redis.exists(key);
                return exists === 1;
            }
            catch {
            }
        }
        const stored = this.otpStore.get(key);
        if (!stored)
            return false;
        if (Date.now() > stored.expiry) {
            this.otpStore.delete(key);
            return false;
        }
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map