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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const ioredis_1 = __importDefault(require("ioredis"));
const uuid_1 = require("uuid");
const constants_1 = require("../../../common/constants");
let TokenService = TokenService_1 = class TokenService {
    jwtService;
    configService;
    redis = null;
    logger = new common_1.Logger(TokenService_1.name);
    tokenStore = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
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
                this.redis.on('connect', () => {
                    this.logger.log('Redis connected successfully');
                });
                this.redis.on('error', (err) => {
                    this.logger.warn(`Redis connection error: ${err.message}. Using in-memory fallback.`);
                    this.redis = null;
                });
            }
            catch (error) {
                this.logger.warn(`Failed to initialize Redis: ${error.message}. Using in-memory fallback.`);
                this.redis = null;
            }
        }
        else {
            this.logger.log('Redis not configured. Using in-memory token storage.');
        }
    }
    async generateTokenPair(payload) {
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload.sub),
        ]);
        await this.storeRefreshToken(payload.sub, refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.getAccessTokenExpirySeconds(),
        };
    }
    async generateAccessToken(payload) {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
        });
    }
    generateRefreshToken(userId) {
        return `${userId}.${(0, uuid_1.v4)()}.${Date.now()}`;
    }
    async storeRefreshToken(userId, refreshToken) {
        const key = constants_1.REDIS_KEYS.USER_SESSION(userId);
        const expiry = this.getRefreshTokenExpirySeconds();
        if (this.redis) {
            try {
                await this.redis.set(key, refreshToken, 'EX', expiry);
            }
            catch (error) {
                this.logger.warn(`Redis store failed: ${error.message}. Using in-memory.`);
                this.storeInMemory(key, refreshToken, expiry);
            }
        }
        else {
            this.storeInMemory(key, refreshToken, expiry);
        }
    }
    storeInMemory(key, token, expirySeconds) {
        const expiry = Date.now() + (expirySeconds * 1000);
        this.tokenStore.set(key, { token, expiry });
    }
    async validateRefreshToken(userId, refreshToken) {
        const key = constants_1.REDIS_KEYS.USER_SESSION(userId);
        if (this.redis) {
            try {
                const storedToken = await this.redis.get(key);
                return storedToken === refreshToken;
            }
            catch {
                return this.validateInMemory(key, refreshToken);
            }
        }
        return this.validateInMemory(key, refreshToken);
    }
    validateInMemory(key, refreshToken) {
        const stored = this.tokenStore.get(key);
        if (!stored)
            return false;
        if (Date.now() > stored.expiry) {
            this.tokenStore.delete(key);
            return false;
        }
        return stored.token === refreshToken;
    }
    async revokeRefreshToken(userId) {
        const key = constants_1.REDIS_KEYS.USER_SESSION(userId);
        if (this.redis) {
            try {
                await this.redis.del(key);
            }
            catch {
                this.tokenStore.delete(key);
            }
        }
        else {
            this.tokenStore.delete(key);
        }
    }
    async verifyAccessToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            return payload;
        }
        catch {
            return null;
        }
    }
    getAccessTokenExpirySeconds() {
        const expiry = this.configService.get('JWT_ACCESS_EXPIRY', '15m');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match)
            return 900;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
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
    getRefreshTokenExpirySeconds() {
        const expiry = this.configService.get('JWT_REFRESH_EXPIRY', '7d');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match)
            return 604800;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
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
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], TokenService);
//# sourceMappingURL=token.service.js.map