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
var GoogleAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GoogleAuthService = GoogleAuthService_1 = class GoogleAuthService {
    configService;
    logger = new common_1.Logger(GoogleAuthService_1.name);
    clientId;
    constructor(configService) {
        this.configService = configService;
        this.clientId = this.configService.get('GOOGLE_CLIENT_ID', '');
        if (!this.clientId) {
            this.logger.warn('GOOGLE_CLIENT_ID not configured. Google Sign-In will not work.');
        }
    }
    async verifyIdToken(idToken) {
        if (!this.clientId) {
            throw new common_1.UnauthorizedException('Google Sign-In is not configured');
        }
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            if (!response.ok) {
                throw new common_1.UnauthorizedException('Invalid Google token');
            }
            const payload = await response.json();
            if (payload.aud !== this.clientId) {
                this.logger.warn('Token audience mismatch');
                throw new common_1.UnauthorizedException('Invalid token audience');
            }
            const expiry = parseInt(payload.exp, 10) * 1000;
            if (Date.now() > expiry) {
                throw new common_1.UnauthorizedException('Token has expired');
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
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Failed to verify Google token:', error);
            throw new common_1.UnauthorizedException('Failed to verify Google token');
        }
    }
    isConfigured() {
        return !!this.clientId;
    }
};
exports.GoogleAuthService = GoogleAuthService;
exports.GoogleAuthService = GoogleAuthService = GoogleAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleAuthService);
//# sourceMappingURL=google-auth.service.js.map