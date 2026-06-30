import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465, // true for 465, false for other ports
          auth: user && pass ? { user, pass } : undefined,
        });
      } catch (err) {
        this.logger.warn('Failed to create SMTP transporter, falling back to console logging.', err as any);
        this.transporter = null;
      }
    } else {
      this.logger.warn('SMTP config not found, emails will be logged to console. Set SMTP_HOST/SMTP_PORT to enable real sending.');
    }
  }

  private get serverUrl(): string {
    return this.configService.get<string>('SERVER_URL') || 'http://localhost:3000';
  }

  private get clientUrl(): string {
    return this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
  }

  private get fromAddress(): string {
    return this.configService.get<string>('FROM_EMAIL') || 'no-reply@zynkra.local';
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${this.serverUrl}/verify-email/${token}`;
    const subject = 'Verify your Zynkra account';
    const text = `Please verify your account by visiting: ${verificationLink}`;
    const html = `<p>Please verify your account by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`;

    if (!this.transporter) {
      this.logger.log(`(DEV) Verification email to ${email}: ${verificationLink}`);
      return Promise.resolve();
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${email}`, err as any);
      throw err;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.clientUrl}/reset-password/${token}`;
    const subject = 'Reset your Zynkra password';
    const text = `Reset your password: ${resetLink}`;
    const html = `<p>Reset your password by clicking the link below:</p><p><a href="${resetLink}">${resetLink}</a></p>`;

    if (!this.transporter) {
      this.logger.log(`(DEV) Password reset email to ${email}: ${resetLink}`);
      return Promise.resolve();
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err as any);
      throw err;
    }
  }

  async sendLoginAlertEmail(email: string, data: { deviceName: string | null; ipAddress: string | null; suspicious: boolean }) {
    const subject = 'New login to your Zynkra account';
    const text = `New login detected. Device: ${data.deviceName ?? 'unknown'}, IP: ${data.ipAddress ?? 'unknown'}.`;
    const html = `<p>New login detected.</p><p>Device: ${data.deviceName ?? 'unknown'}</p><p>IP: ${data.ipAddress ?? 'unknown'}</p>`;

    if (!this.transporter) {
      this.logger.log(`(DEV) Login alert to ${email}: ${text}`);
      return Promise.resolve();
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Login alert email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send login alert email to ${email}`, err as any);
      throw err;
    }
  }

  async sendTrustedRecoveryCodeEmail(email: string, code: string) {
    const subject = 'Recovery code for Zynkra account';
    const text = `Your recovery code is: ${code}`;
    const html = `<p>Your recovery code is: <strong>${code}</strong></p>`;

    if (!this.transporter) {
      this.logger.log(`(DEV) Trusted recovery code to ${email}: ${code}`);
      return Promise.resolve();
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Trusted recovery code email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send trusted recovery code to ${email}`, err as any);
      throw err;
    }
  }
}