"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPasswordResetTemplate = getPasswordResetTemplate;
exports.getEmailVerificationTemplate = getEmailVerificationTemplate;
exports.getWelcomeTemplate = getWelcomeTemplate;
const baseStyles = `
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header .logo { font-size: 36px; margin-bottom: 10px; }
    .content { padding: 40px 30px; color: #e0e0e0; }
    .content h2 { color: #ffffff; margin-top: 0; font-size: 22px; }
    .content p { line-height: 1.6; margin: 16px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .otp-box { background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 700; color: #8b5cf6; letter-spacing: 8px; margin: 0; }
    .footer { background: #0a0a0f; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }
    .footer a { color: #8b5cf6; text-decoration: none; }
    .warning { background: rgba(234, 88, 12, 0.1); border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #fdba74; }
`;
const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
</head>
<body>
    <div style="padding: 20px; background-color: #0a0a0f;">
        <div class="container">
            ${content}
        </div>
    </div>
</body>
</html>
`;
function getPasswordResetTemplate(params) {
    const { userName, resetUrl, expiryMinutes } = params;
    return getBaseTemplate(`
        <div class="header">
            <div class="logo">🔐</div>
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hi ${userName},</h2>
            <p>We received a request to reset your password for your JobRefer account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
                ⚠️ This link will expire in <strong>${expiryMinutes} minutes</strong>. If you didn't request this, please ignore this email.
            </div>
            <p style="font-size: 14px; color: #888;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
            </p>
        </div>
        <div class="footer">
            <p>This email was sent by JobRefer. If you didn't request a password reset, you can safely ignore this email.</p>
            <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
    `);
}
function getEmailVerificationTemplate(params) {
    const { userName, otp, expiryMinutes } = params;
    return getBaseTemplate(`
        <div class="header">
            <div class="logo">✉️</div>
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hi ${userName},</h2>
            <p>Thanks for signing up for JobRefer! Please verify your email address using the code below:</p>
            <div class="otp-box">
                <p class="otp-code">${otp}</p>
            </div>
            <div class="warning">
                ⏱️ This code will expire in <strong>${expiryMinutes} minutes</strong>.
            </div>
            <p>If you didn't create an account with JobRefer, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2026 JobRefer. All rights reserved.</p>
            <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
    `);
}
function getWelcomeTemplate(params) {
    const { userName, dashboardUrl } = params;
    return getBaseTemplate(`
        <div class="header">
            <div class="logo">🎉</div>
            <h1>Welcome to JobRefer!</h1>
        </div>
        <div class="content">
            <h2>Hey ${userName},</h2>
            <p>Welcome aboard! You've just joined India's #1 job referral platform.</p>
            <p>Here's what you can do now:</p>
            <ul style="color: #e0e0e0; line-height: 2;">
                <li>📝 Browse thousands of job openings</li>
                <li>🧠 Take pre-screening tests to prove your skills</li>
                <li>🤝 Get verified referrals from employees</li>
                <li>💰 Pay only after you get referred!</li>
            </ul>
            <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            <p style="color: #888;">Have questions? Reply to this email and we'll help you out!</p>
        </div>
        <div class="footer">
            <p>© 2026 JobRefer. All rights reserved.</p>
            <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
    `);
}
//# sourceMappingURL=index.js.map