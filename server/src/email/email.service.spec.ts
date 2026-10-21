import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const createTransport = nodemailer.createTransport as jest.Mock;

function makeService(env: Record<string, unknown>) {
  const configService = { get: (key: string) => env[key] };
  return new EmailService(configService as never);
}

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transport setup', () => {
    it('creates an SMTP transport with auth when full credentials are configured', () => {
      makeService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'u',
        SMTP_PASS: 'p',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'u', pass: 'p' },
      });
    });

    it('marks port 465 as secure and omits auth without credentials', () => {
      makeService({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: 465 });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: undefined,
      });
    });

    it('falls back to console logging when SMTP is not configured', () => {
      const service = makeService({});
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
      expect(service).toBeInstanceOf(EmailService);
    });
  });

  describe('dev fallback (no transporter)', () => {
    it.each([
      ['sendVerificationCode', (s: EmailService) => s.sendVerificationCode('a@b.c', '123456')],
      ['sendVerificationEmail', (s: EmailService) => s.sendVerificationEmail('a@b.c', 'tok')],
      ['sendPasswordResetEmail', (s: EmailService) => s.sendPasswordResetEmail('a@b.c', 'tok')],
      ['sendMagicLinkEmail', (s: EmailService) => s.sendMagicLinkEmail('a@b.c', 'https://x/magic')],
      [
        'sendLoginAlertEmail',
        (s: EmailService) =>
          s.sendLoginAlertEmail('a@b.c', { deviceName: null, ipAddress: null, suspicious: false }),
      ],
      [
        'sendTrustedRecoveryCodeEmail',
        (s: EmailService) => s.sendTrustedRecoveryCodeEmail('a@b.c', '999'),
      ],
      [
        'sendNotificationEmail',
        (s: EmailService) => s.sendNotificationEmail('a@b.c', 'Hi', '<p>hi</p>'),
      ],
    ])('%s resolves without sending when SMTP is unconfigured', async (_name, call) => {
      await expect(call(makeService({}))).resolves.toBeUndefined();
    });
  });

  describe('sending with a configured transport', () => {
    let sendMail: jest.Mock;

    beforeEach(() => {
      sendMail = jest.fn().mockResolvedValue({ accepted: ['a@b.c'] });
      createTransport.mockReturnValue({ sendMail });
    });

    it('sends the verification code with the code in the body and configured from-address', async () => {
      const service = makeService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        FROM_EMAIL: 'noreply@example.com',
      });

      await service.sendVerificationCode('a@b.c', '424242');

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'a@b.c',
          subject: expect.stringContaining('verification code'),
          text: expect.stringContaining('424242'),
          html: expect.stringContaining('424242'),
        })
      );
    });

    it('links verification and reset emails at the configured client URL', async () => {
      const service = makeService({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        CLIENT_URL: 'https://app.example.com',
      });

      await service.sendVerificationEmail('a@b.c', 'tok123');
      await service.sendPasswordResetEmail('a@b.c', 'tok456');

      expect(sendMail.mock.calls[0][0].text).toContain(
        'https://app.example.com/verify-email/tok123'
      );
      expect(sendMail.mock.calls[1][0].text).toContain(
        'https://app.example.com/reset-password/tok456'
      );
    });

    it('falls back to placeholders when login alert details are missing', async () => {
      const service = makeService({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: 587 });

      await service.sendLoginAlertEmail('a@b.c', {
        deviceName: null,
        ipAddress: null,
        suspicious: true,
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Device: unknown'),
        })
      );
      expect(sendMail.mock.calls[0][0].text).toContain('IP: unknown');
    });

    it('defaults the notification email text when none is provided', async () => {
      const service = makeService({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: 587 });

      await service.sendNotificationEmail('a@b.c', 'New notification', '<p>x</p>');

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'New notification',
          text: expect.stringContaining('new notification'),
          html: '<p>x</p>',
        })
      );
    });

    it('propagates transport failures so callers can react', async () => {
      const service = makeService({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: 587 });
      sendMail.mockRejectedValue(new Error('smtp down'));

      await expect(service.sendVerificationCode('a@b.c', '1')).rejects.toThrow('smtp down');
    });
  });
});
