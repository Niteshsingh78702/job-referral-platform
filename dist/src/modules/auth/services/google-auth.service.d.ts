import { ConfigService } from '@nestjs/config';
interface GoogleTokenPayload {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}
export declare class GoogleAuthService {
    private configService;
    private readonly logger;
    private readonly clientId;
    constructor(configService: ConfigService);
    verifyIdToken(idToken: string): Promise<GoogleTokenPayload>;
    isConfigured(): boolean;
}
export {};
