import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  getWelcomeTemplate,
} from './templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get(
      'EMAIL_FROM',
      'noreply@jobrefer.com',
    );
    this.isEnabled = this.initTransporter();
  }

  private initTransporter(): boolean {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP not configured. Emails will be logged to console.',
      );
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
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // Log email in development or if SMTP not configured
    if (
      !this.isEnabled ||
      this.configService.get('NODE_ENV') === 'development'
    ) {
      this.logger.log('='.repeat(60));
      this.logger.log(
        `📧 EMAIL (${this.isEnabled ? 'also sent' : 'console only'})`,
      );
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
        text: text || this.stripHtml(html),
      });
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Send password reset email with link
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}#reset-password?token=${resetToken}`;

    const html = getPasswordResetTemplate({
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

  // Send email verification
  async sendVerificationEmail(
    to: string,
    otp: string,
    userName?: string,
  ): Promise<boolean> {
    const html = getEmailVerificationTemplate({
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

  // Send welcome email
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const html = getWelcomeTemplate({
      userName,
      dashboardUrl: `${frontendUrl}#dashboard`,
    });

    return this.sendEmail({
      to,
      subject: 'Welcome to JobRefer! 🎉',
      html,
    });
  }
}
