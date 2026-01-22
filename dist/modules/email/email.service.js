"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EmailService", {
    enumerable: true,
    get: function() {
        return EmailService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _nodemailer = /*#__PURE__*/ _interop_require_wildcard(require("nodemailer"));
const _templates = require("./templates");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
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
let EmailService = class EmailService {
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
            this.transporter = _nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort || '587', 10),
                secure: smtpPort === '465',
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });
            this.logger.log('Email service initialized with SMTP');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize email transporter:', error);
            return false;
        }
    }
    async sendEmail(options) {
        const { to, subject, html, text } = options;
        // Log email in development or if SMTP not configured
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
            return !this.isEnabled; // Return true if email is intentionally disabled
        }
        try {
            await this.transporter.sendMail({
                from: `"JobRefer" <${this.fromEmail}>`,
                to,
                subject,
                html,
                text: text || this.stripHtml(html)
            });
            this.logger.log(`Email sent successfully to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    // Send password reset email with link
    async sendPasswordResetEmail(to, resetToken, userName) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const resetUrl = `${frontendUrl}#reset-password?token=${resetToken}`;
        const html = (0, _templates.getPasswordResetTemplate)({
            userName: userName || 'User',
            resetUrl,
            expiryMinutes: 60
        });
        return this.sendEmail({
            to,
            subject: 'Reset Your JobRefer Password',
            html,
            text: `Reset your password using this link: ${resetUrl}\n\nThis link will expire in 60 minutes.`
        });
    }
    // Send email verification
    async sendVerificationEmail(to, otp, userName) {
        const html = (0, _templates.getEmailVerificationTemplate)({
            userName: userName || 'User',
            otp,
            expiryMinutes: 10
        });
        return this.sendEmail({
            to,
            subject: 'Verify Your JobRefer Email',
            html,
            text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
        });
    }
    // Send welcome email
    async sendWelcomeEmail(to, userName) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const html = (0, _templates.getWelcomeTemplate)({
            userName,
            dashboardUrl: `${frontendUrl}#dashboard`
        });
        return this.sendEmail({
            to,
            subject: 'Welcome to JobRefer! 🎉',
            html
        });
    }
    constructor(configService){
        this.configService = configService;
        this.transporter = null;
        this.logger = new _common.Logger(EmailService.name);
        this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@jobrefer.com');
        this.isEnabled = this.initTransporter();
    }
};
EmailService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], EmailService);

//# sourceMappingURL=email.service.js.map