import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  rootRedirect(@Res() res: Response) {
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');
    return res.redirect(clientUrl);
  }

  @Get('verify-email/:token')
  async verifyEmailPage(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const clientUrl = this.configService
      .get<string>('CLIENT_URL', 'http://localhost:5173')
      .replace(/\/$/, '');

    try {
      await this.authService.verifyEmail(token, req);

      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verified</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #0f172a; }
      .card { max-width: 520px; width: 100%; padding: 2rem; border-radius: 1rem; background: #ffffff; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12); text-align: center; }
      .button { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.5rem; background: #2563eb; color: #ffffff; border: none; border-radius: 0.75rem; text-decoration: none; font-weight: 600; margin-top: 1.5rem; }
      .subtitle { margin-top: 1rem; color: #475569; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Email Verified</h1>
      <p class="subtitle">Your email has been successfully verified.</p>
      <a class="button" href="${clientUrl}">Open Zynkra</a>
    </div>
  </body>
</html>`;
      return res.type('text/html').send(html);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to verify your email.';
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification Failed</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #0f172a; }
      .card { max-width: 520px; width: 100%; padding: 2rem; border-radius: 1rem; background: #ffffff; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12); text-align: center; }
      .error { color: #b91c1c; margin-top: 1rem; }
      .button { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.5rem; background: #2563eb; color: #ffffff; border: none; border-radius: 0.75rem; text-decoration: none; font-weight: 600; margin-top: 1.5rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Verification Failed</h1>
      <p class="error">${message}</p>
      <a class="button" href="${clientUrl}/login">Go to Login</a>
    </div>
  </body>
</html>`;
      return res.type('text/html').status(400).send(html);
    }
  }
}
