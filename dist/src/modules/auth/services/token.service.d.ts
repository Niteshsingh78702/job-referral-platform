import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
export declare class TokenService {
    private jwtService;
    private configService;
    private redis;
    private readonly logger;
    private tokenStore;
    constructor(jwtService: JwtService, configService: ConfigService);
    private initRedis;
    generateTokenPair(payload: JwtPayload): Promise<TokenPair>;
    private generateAccessToken;
    private generateRefreshToken;
    private storeRefreshToken;
    private storeInMemory;
    validateRefreshToken(userId: string, refreshToken: string): Promise<boolean>;
    private validateInMemory;
    revokeRefreshToken(userId: string): Promise<void>;
    verifyAccessToken(token: string): Promise<JwtPayload | null>;
    private getAccessTokenExpirySeconds;
    private getRefreshTokenExpirySeconds;
}
