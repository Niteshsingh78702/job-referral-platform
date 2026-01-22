"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TokenService", {
    enumerable: true,
    get: function() {
        return TokenService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _jwt = require("@nestjs/jwt");
const _ioredis = /*#__PURE__*/ _interop_require_default(require("ioredis"));
const _uuid = require("uuid");
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
let TokenService = class TokenService {
    initRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST');
        // Only connect to Redis if explicitly configured
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
                this.redis.on('connect', ()=>{
                    this.logger.log('Redis connected successfully');
                });
                this.redis.on('error', (err)=>{
                    this.logger.warn(`Redis connection error: ${err.message}. Using in-memory fallback.`);
                    this.redis = null;
                });
            } catch (error) {
                this.logger.warn(`Failed to initialize Redis: ${error.message}. Using in-memory fallback.`);
                this.redis = null;
            }
        } else {
            this.logger.log('Redis not configured. Using in-memory token storage.');
        }
    }
    // Generate token pair (access + refresh)
    async generateTokenPair(payload) {
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload.sub)
        ]);
        // Store refresh token
        await this.storeRefreshToken(payload.sub, refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.getAccessTokenExpirySeconds()
        };
    }
    // Generate access token
    async generateAccessToken(payload) {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m')
        });
    }
    // Generate refresh token
    generateRefreshToken(userId) {
        return `${userId}.${(0, _uuid.v4)()}.${Date.now()}`;
    }
    // Store refresh token (Redis or in-memory)
    async storeRefreshToken(userId, refreshToken) {
        const key = _constants.REDIS_KEYS.USER_SESSION(userId);
        const expiry = this.getRefreshTokenExpirySeconds();
        if (this.redis) {
            try {
                await this.redis.set(key, refreshToken, 'EX', expiry);
            } catch (error) {
                this.logger.warn(`Redis store failed: ${error.message}. Using in-memory.`);
                this.storeInMemory(key, refreshToken, expiry);
            }
        } else {
            this.storeInMemory(key, refreshToken, expiry);
        }
    }
    storeInMemory(key, token, expirySeconds) {
        const expiry = Date.now() + expirySeconds * 1000;
        this.tokenStore.set(key, {
            token,
            expiry
        });
    }
    // Validate refresh token
    async validateRefreshToken(userId, refreshToken) {
        const key = _constants.REDIS_KEYS.USER_SESSION(userId);
        if (this.redis) {
            try {
                const storedToken = await this.redis.get(key);
                return storedToken === refreshToken;
            } catch  {
                return this.validateInMemory(key, refreshToken);
            }
        }
        return this.validateInMemory(key, refreshToken);
    }
    validateInMemory(key, refreshToken) {
        const stored = this.tokenStore.get(key);
        if (!stored) return false;
        if (Date.now() > stored.expiry) {
            this.tokenStore.delete(key);
            return false;
        }
        return stored.token === refreshToken;
    }
    // Revoke refresh token
    async revokeRefreshToken(userId) {
        const key = _constants.REDIS_KEYS.USER_SESSION(userId);
        if (this.redis) {
            try {
                await this.redis.del(key);
            } catch  {
                this.tokenStore.delete(key);
            }
        } else {
            this.tokenStore.delete(key);
        }
    }
    // Verify access token
    async verifyAccessToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET')
            });
            return payload;
        } catch  {
            return null;
        }
    }
    // Get access token expiry in seconds
    getAccessTokenExpirySeconds() {
        const expiry = this.configService.get('JWT_ACCESS_EXPIRY', '15m');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match) return 900; // default 15 minutes
        const value = parseInt(match[1]);
        const unit = match[2];
        switch(unit){
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 900;
        }
    }
    // Get refresh token expiry in seconds
    getRefreshTokenExpirySeconds() {
        const expiry = this.configService.get('JWT_REFRESH_EXPIRY', '7d');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match) return 604800; // default 7 days
        const value = parseInt(match[1]);
        const unit = match[2];
        switch(unit){
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 604800;
        }
    }
    constructor(jwtService, configService){
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = null;
        this.logger = new _common.Logger(TokenService.name);
        // In-memory fallback when Redis is unavailable
        this.tokenStore = new Map();
        this.initRedis();
    }
};
TokenService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], TokenService);

//# sourceMappingURL=token.service.js.map