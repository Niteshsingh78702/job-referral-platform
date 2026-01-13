import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private configService;
    private transporter;
    private readonly logger;
    private readonly fromEmail;
    private readonly isEnabled;
    constructor(configService: ConfigService);
    private initTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    private stripHtml;
    sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<boolean>;
    sendVerificationEmail(to: string, otp: string, userName?: string): Promise<boolean>;
    sendWelcomeEmail(to: string, userName: string): Promise<boolean>;
}
