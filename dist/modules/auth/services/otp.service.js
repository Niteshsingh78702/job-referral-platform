"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OtpService", {
    enumerable: true,
    get: function() {
        return OtpService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _ioredis = /*#__PURE__*/ _interop_require_default(require("ioredis"));
const _constants = require("../../../common/constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let OtpService = class OtpService {
    initRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');
        if (redisUrl || redisHost) {
            try {
                if (redisUrl) {
                    this.redis = new _ioredis.default(redisUrl);
                } else {
                    this.redis = new _ioredis.default({
                        host: redisHost || 'localhost',
                        port: this.configService.get('REDIS_PORT', 6379),
                        password: this.configService.get('REDIS_PASSWORD')
                    });
                }
                this.redis.on('error', (err)=>{
                    this.logger.warn(`Redis error: ${err.message}. Using in-memory.`);
                    this.redis = null;
                });
            } catch  {
                this.logger.warn('Redis not available. Using in-memory OTP storage.');
            }
        }
    }
    // Generate OTP
    generateOtp() {
        const digits = '0123456789';
        let otp = '';
        for(let i = 0; i < this.otpLength; i++){
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
    // Store OTP
    async storeOtp(userId, type, otp) {
        const key = _constants.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                await this.redis.set(key, otp, 'EX', this.otpExpiry);
                return;
            } catch  {
            // Fall through to in-memory
            }
        }
        this.otpStore.set(key, {
            otp,
            expiry: Date.now() + this.otpExpiry * 1000
        });
    }
    // Verify OTP
    async verifyOtp(userId, type, otp) {
        const key = _constants.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                const storedOtp = await this.redis.get(key);
                if (!storedOtp || storedOtp !== otp) {
                    return false;
                }
                await this.redis.del(key);
                return true;
            } catch  {
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
    async invalidateOtp(userId, type) {
        const key = _constants.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                await this.redis.del(key);
            } catch  {
                this.otpStore.delete(key);
            }
        } else {
            this.otpStore.delete(key);
        }
    }
    // Check if OTP exists
    async hasOtp(userId, type) {
        const key = _constants.REDIS_KEYS.OTP(userId, type);
        if (this.redis) {
            try {
                const exists = await this.redis.exists(key);
                return exists === 1;
            } catch  {
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
    constructor(configService){
        this.configService = configService;
        this.redis = null;
        this.logger = new _common.Logger(OtpService.name);
        // In-memory fallback
        this.otpStore = new Map();
        this.otpExpiry = this.configService.get('OTP_EXPIRY_MINUTES', 10) * 60;
        this.otpLength = this.configService.get('OTP_LENGTH', 6);
        this.initRedis();
    }
};
OtpService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], OtpService);

//# sourceMappingURL=otp.service.js.map