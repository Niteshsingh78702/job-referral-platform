"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const templates_1 = require("./templates");
let EmailService = EmailService_1 = class EmailService {
    configService;
    transporter = null;
    logger = new common_1.Logger(EmailService_1.name);
    fromEmail;
    isEnabled;
    constructor(configService) {
        this.configService = configService;
        this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@jobrefer.com');
        this.isEnabled = this.initTransporter();
    }
    initTransporter() {
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get('SMTP_PORT');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (!smtpHost || !smtpUser || !smtpPass) {
            this.logger.warn('SMTP not configured. Emails will be logged to console.');
            return false;
        }
        try {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort || '587', 10),
                secure: smtpPort === '465',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.logger.log('Email service initialized with SMTP');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to initialize email transporter:', error);
            return false;
        }
    }
    async sendEmail(options) {
        const { to, subject, html, text } = options;
        if (!this.isEnabled || this.configService.get('NODE_ENV') === 'development') {
            this.logger.log('='.repeat(60));
            this.logger.log(`📧 EMAIL (${this.isEnabled ? 'also sent' : 'console only'})`);
            this.logger.log(`To: ${to}`);
            this.logger.log(`Subject: ${subject}`);
            this.logger.log('-'.repeat(60));
            if (text) {
                this.logger.log(text);
            }
            this.logger.log('='.repeat(60));
        }
        if (!this.transporter) {
            return !this.isEnabled;
        }
        try {
            await this.transporter.sendMail({
                from: `"JobRefer" <${this.fromEmail}>`,
                to,
                subject,
                html,
                text: text || this.stripHtml(html),
            });
            this.logger.log(`Email sent successfully to ${to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
    stripHtml(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async sendPasswordResetEmail(to, resetToken, userName) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const resetUrl = `${frontendUrl}#reset-password?token=${resetToken}`;
        const html = (0, templates_1.getPasswordResetTemplate)({
            userName: userName || 'User',
            resetUrl,
            expiryMinutes: 60,
        });
        return this.sendEmail({
            to,
            subject: 'Reset Your JobRefer Password',
            html,
            text: `Reset your password using this link: ${resetUrl}\n\nThis link will expire in 60 minutes.`,
        });
    }
    async sendVerificationEmail(to, otp, userName) {
        const html = (0, templates_1.getEmailVerificationTemplate)({
            userName: userName || 'User',
            otp,
            expiryMinutes: 10,
        });
        return this.sendEmail({
            to,
            subject: 'Verify Your JobRefer Email',
            html,
            text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
        });
    }
    async sendWelcomeEmail(to, userName) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const html = (0, templates_1.getWelcomeTemplate)({
            userName,
            dashboardUrl: `${frontendUrl}#dashboard`,
        });
        return this.sendEmail({
            to,
            subject: 'Welcome to JobRefer! 🎉',
            html,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map