import { Injectable, Logger } from '@nestjs/common';
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
  private redis: Redis | null = null;
  private readonly logger = new Logger(TokenService.name);
  // In-memory fallback when Redis is unavailable
  private tokenStore: Map<string, { token: string; expiry: number }> =
    new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.initRedis();
  }

  private initRedis(): void {
    const redisUrl = this.configService.get('REDIS_URL');
    const redisHost = this.configService.get('REDIS_HOST');

    // Only connect to Redis if explicitly configured
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

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });

        this.redis.on('error', (err) => {
          this.logger.warn(
            `Redis connection error: ${err.message}. Using in-memory fallback.`,
          );
          this.redis = null;
        });
      } catch (error) {
        this.logger.warn(
          `Failed to initialize Redis: ${(error as Error).message}. Using in-memory fallback.`,
        );
        this.redis = null;
      }
    } else {
      this.logger.log('Redis not configured. Using in-memory token storage.');
    }
  }

  // Generate token pair (access + refresh)
  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload.sub),
    ]);

    // Store refresh token
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
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '7d'), // 7 days default for persistent login
    });
  }

  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    return `${userId}.${uuidv4()}.${Date.now()}`;
  }

  // Store refresh token (Redis or in-memory)
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const key = REDIS_KEYS.USER_SESSION(userId);
    const expiry = this.getRefreshTokenExpirySeconds();

    if (this.redis) {
      try {
        await this.redis.set(key, refreshToken, 'EX', expiry);
      } catch (error) {
        this.logger.warn(
          `Redis store failed: ${(error as Error).message}. Using in-memory.`,
        );
        this.storeInMemory(key, refreshToken, expiry);
      }
    } else {
      this.storeInMemory(key, refreshToken, expiry);
    }
  }

  private storeInMemory(
    key: string,
    token: string,
    expirySeconds: number,
  ): void {
    const expiry = Date.now() + expirySeconds * 1000;
    this.tokenStore.set(key, { token, expiry });
  }

  // Validate refresh token
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const key = REDIS_KEYS.USER_SESSION(userId);

    if (this.redis) {
      try {
        const storedToken = await this.redis.get(key);
        return storedToken === refreshToken;
      } catch {
        return this.validateInMemory(key, refreshToken);
      }
    }
    return this.validateInMemory(key, refreshToken);
  }

  private validateInMemory(key: string, refreshToken: string): boolean {
    const stored = this.tokenStore.get(key);
    if (!stored) return false;
    if (Date.now() > stored.expiry) {
      this.tokenStore.delete(key);
      return false;
    }
    return stored.token === refreshToken;
  }

  // Revoke refresh token
  async revokeRefreshToken(userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_SESSION(userId);

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        this.tokenStore.delete(key);
      }
    } else {
      this.tokenStore.delete(key);
    }
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
    const expiry = this.configService.get('JWT_ACCESS_EXPIRY', '7d');
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
