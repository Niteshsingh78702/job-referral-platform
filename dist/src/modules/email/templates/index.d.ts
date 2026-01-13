export interface PasswordResetTemplateParams {
    userName: string;
    resetUrl: string;
    expiryMinutes: number;
}
export declare function getPasswordResetTemplate(params: PasswordResetTemplateParams): string;
export interface EmailVerificationTemplateParams {
    userName: string;
    otp: string;
    expiryMinutes: number;
}
export declare function getEmailVerificationTemplate(params: EmailVerificationTemplateParams): string;
export interface WelcomeTemplateParams {
    userName: string;
    dashboardUrl: string;
}
export declare function getWelcomeTemplate(params: WelcomeTemplateParams): string;
