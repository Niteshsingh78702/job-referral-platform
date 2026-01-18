"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GoogleAuthService", {
    enumerable: true,
    get: function() {
        return GoogleAuthService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let GoogleAuthService = class GoogleAuthService {
    /**
     * Verify Google ID token and extract user info
     * Uses Google's tokeninfo endpoint for simplicity (no additional dependencies)
     */ async verifyIdToken(idToken) {
        if (!this.clientId) {
            throw new _common.UnauthorizedException('Google Sign-In is not configured');
        }
        try {
            // Use Google's tokeninfo endpoint to verify the token
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            if (!response.ok) {
                throw new _common.UnauthorizedException('Invalid Google token');
            }
            const payload = await response.json();
            // Verify the token was issued for our app
            if (payload.aud !== this.clientId) {
                this.logger.warn('Token audience mismatch');
                throw new _common.UnauthorizedException('Invalid token audience');
            }
            // Check token expiration
            const expiry = parseInt(payload.exp, 10) * 1000;
            if (Date.now() > expiry) {
                throw new _common.UnauthorizedException('Token has expired');
            }
            return {
                sub: payload.sub,
                email: payload.email,
                email_verified: payload.email_verified === 'true',
                name: payload.name,
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture
            };
        } catch (error) {
            if (error instanceof _common.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Failed to verify Google token:', error);
            throw new _common.UnauthorizedException('Failed to verify Google token');
        }
    }
    /**
     * Check if Google OAuth is configured
     */ isConfigured() {
        return !!this.clientId;
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(GoogleAuthService.name);
        this.clientId = this.configService.get('GOOGLE_CLIENT_ID', '');
        if (!this.clientId) {
            this.logger.warn('GOOGLE_CLIENT_ID not configured. Google Sign-In will not work.');
        }
    }
};
GoogleAuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], GoogleAuthService);

//# sourceMappingURL=google-auth.service.js.map