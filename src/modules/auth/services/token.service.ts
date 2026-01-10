import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_KEYS } from '../../../common/constants';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable()
export class TokenService {
    private redis: Redis;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
        });
    }

    // Generate token pair (access + refresh)
    async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload.sub),
        ]);

        // Store refresh token in Redis
        await this.storeRefreshToken(payload.sub, refreshToken);

        return {
            accessToken,
            refreshToken,
            expiresIn: this.getAccessTokenExpirySeconds(),
        };
    }

    // Generate access token
    private async generateAccessToken(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
        });
    }

    // Generate refresh token
    private generateRefreshToken(userId: string): string {
        return `${userId}.${uuidv4()}.${Date.now()}`;
    }

    // Store refresh token in Redis
    private async storeRefreshToken(
        userId: string,
        refreshToken: string,
    ): Promise<void> {
        const key = REDIS_KEYS.USER_SESSION(userId);
        const expiry = this.getRefreshTokenExpirySeconds();
        await this.redis.set(key, refreshToken, 'EX', expiry);
    }

    // Validate refresh token
    async validateRefreshToken(
        userId: string,
        refreshToken: string,
    ): Promise<boolean> {
        const key = REDIS_KEYS.USER_SESSION(userId);
        const storedToken = await this.redis.get(key);
        return storedToken === refreshToken;
    }

    // Revoke refresh token
    async revokeRefreshToken(userId: string): Promise<void> {
        const key = REDIS_KEYS.USER_SESSION(userId);
        await this.redis.del(key);
    }

    // Verify access token
    async verifyAccessToken(token: string): Promise<JwtPayload | null> {
        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            return payload;
        } catch {
            return null;
        }
    }

    // Get access token expiry in seconds
    private getAccessTokenExpirySeconds(): number {
        const expiry = this.configService.get('JWT_ACCESS_EXPIRY', '15m');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match) return 900; // default 15 minutes

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

    // Get refresh token expiry in seconds
    private getRefreshTokenExpirySeconds(): number {
        const expiry = this.configService.get('JWT_REFRESH_EXPIRY', '7d');
        const match = expiry.match(/(\d+)([smhd])/);
        if (!match) return 604800; // default 7 days

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
}
