import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GoogleTokenPayload {
    sub: string; // Google user ID
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

@Injectable()
export class GoogleAuthService {
    private readonly logger = new Logger(GoogleAuthService.name);
    private readonly clientId: string;

    constructor(private configService: ConfigService) {
        this.clientId = this.configService.get('GOOGLE_CLIENT_ID', '');
        if (!this.clientId) {
            this.logger.warn('GOOGLE_CLIENT_ID not configured. Google Sign-In will not work.');
        }
    }

    /**
     * Verify Google ID token and extract user info
     * Uses Google's tokeninfo endpoint for simplicity (no additional dependencies)
     */
    async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
        if (!this.clientId) {
            throw new UnauthorizedException('Google Sign-In is not configured');
        }

        try {
            // Use Google's tokeninfo endpoint to verify the token
            const response = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
            );

            if (!response.ok) {
                throw new UnauthorizedException('Invalid Google token');
            }

            const payload = await response.json();

            // Verify the token was issued for our app
            if (payload.aud !== this.clientId) {
                this.logger.warn('Token audience mismatch');
                throw new UnauthorizedException('Invalid token audience');
            }

            // Check token expiration
            const expiry = parseInt(payload.exp, 10) * 1000;
            if (Date.now() > expiry) {
                throw new UnauthorizedException('Token has expired');
            }

            return {
                sub: payload.sub,
                email: payload.email,
                email_verified: payload.email_verified === 'true',
                name: payload.name,
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error('Failed to verify Google token:', error);
            throw new UnauthorizedException('Failed to verify Google token');
        }
    }

    /**
     * Check if Google OAuth is configured
     */
    isConfigured(): boolean {
        return !!this.clientId;
    }
}
