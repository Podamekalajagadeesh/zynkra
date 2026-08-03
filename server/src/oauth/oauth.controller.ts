import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OAuthService } from './oauth.service';
import { CreateOAuthAppDto } from './dto/create-oauth-app.dto';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('apps')
  createApp(@Req() req, @Body() dto: CreateOAuthAppDto) {
    return this.oauthService.createApp(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('apps')
  listApps(@Req() req) {
    return this.oauthService.listApps(req.user.userId);
  }

  @Get('apps/:id')
  getApp(@Param('id') id: string) {
    return this.oauthService.getApp(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('apps/:id')
  updateApp(@Req() req, @Param('id') id: string, @Body() dto: Partial<CreateOAuthAppDto>) {
    return this.oauthService.updateApp(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('apps/:id')
  deleteApp(@Req() req, @Param('id') id: string) {
    return this.oauthService.deleteApp(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apps/:id/rotate-secret')
  rotateSecret(@Req() req, @Param('id') id: string) {
    return this.oauthService.rotateSecret(req.user.userId, id);
  }

  // User consent — issues a one-time code bound to the PKCE challenge.
  @UseGuards(JwtAuthGuard)
  @Post('authorize')
  authorize(@Req() req, @Body() body: {
    appId: string;
    scopes: string[];
    codeChallenge: string;
    codeChallengeMethod?: string;
  }) {
    return this.oauthService.authorize(
      req.user.userId,
      body.appId,
      body.scopes,
      body.codeChallenge,
      body.codeChallengeMethod,
    );
  }

  // Token endpoint — public; requires the one-time code + PKCE verifier.
  @Post('token')
  token(@Body() body: { code: string; codeVerifier: string; clientId: string }) {
    return this.oauthService.exchangeToken(body.code, body.codeVerifier, body.clientId);
  }

  // Introspect an OAuth access token.
  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const { userId, scopes } = await this.oauthService.introspect(token);
    const user = await this.oauthService.getUserSummary(userId);
    return { user, scopes };
  }
}
