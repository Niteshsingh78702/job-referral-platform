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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const constants_1 = require("../../../common/constants");
let OtpService = class OtpService {
    configService;
    redis;
    otpExpiry;
    otpLength;
    constructor(configService) {
        this.configService = configService;
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
        });
        this.otpExpiry = this.configService.get('OTP_EXPIRY_MINUTES', 10) * 60;
        this.otpLength = this.configService.get('OTP_LENGTH', 6);
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
        await this.redis.set(key, otp, 'EX', this.otpExpiry);
    }
    async verifyOtp(userId, type, otp) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        const storedOtp = await this.redis.get(key);
        if (!storedOtp || storedOtp !== otp) {
            return false;
        }
        await this.redis.del(key);
        return true;
    }
    async invalidateOtp(userId, type) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        await this.redis.del(key);
    }
    async hasOtp(userId, type) {
        const key = constants_1.REDIS_KEYS.OTP(userId, type);
        const exists = await this.redis.exists(key);
        return exists === 1;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map