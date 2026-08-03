import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { OAuthApp } from './entities/oauth-app.entity';
import { OAuthAuthorization } from './entities/oauth-authorization.entity';
import { OAUTH_SCOPES, CreateOAuthAppDto } from './dto/create-oauth-app.dto';
import { UsersService } from '../users/users.service';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_TTL = '1h';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('base64url');
}

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(OAuthApp)
    private appsRepository: Repository<OAuthApp>,
    @InjectRepository(OAuthAuthorization)
    private authorizationsRepository: Repository<OAuthAuthorization>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Returns the plaintext client secret exactly once so the developer can store it.
  async createApp(
    developerId: string,
    dto: CreateOAuthAppDto,
  ): Promise<OAuthApp & { clientSecret: string }> {
    const developer = await this.usersService.findOneById(developerId);
    if (!developer) {
      throw new NotFoundException('User not found');
    }
    const scopes = (dto.scopes ?? ['read_profile']).filter((scope) =>
      OAUTH_SCOPES.includes(scope),
    );
    if (scopes.length === 0) {
      throw new BadRequestException('No valid scopes requested');
    }

    const clientSecret = randomBytes(32).toString('base64url');
    const app = this.appsRepository.create({
      developer,
      name: dto.name,
      description: dto.description ?? null,
      redirectUris: dto.redirectUris,
      scopes,
      homepageUrl: dto.homepageUrl ?? null,
      clientId: randomBytes(16).toString('hex'),
      clientSecretHash: sha256(clientSecret),
      isPublic: false,
    });
    const saved = await this.appsRepository.save(app);
    return { ...saved, clientSecret };
  }

  async listApps(developerId: string): Promise<OAuthApp[]> {
    return this.appsRepository.find({
      where: { developer: { id: developerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getApp(appId: string): Promise<OAuthApp> {
    const app = await this.appsRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('OAuth app not found');
    }
    return app;
  }

  async updateApp(developerId: string, appId: string, dto: Partial<CreateOAuthAppDto>) {
    const app = await this.getOwnedApp(developerId, appId);
    if (dto.name !== undefined) app.name = dto.name;
    if (dto.description !== undefined) app.description = dto.description;
    if (dto.homepageUrl !== undefined) app.homepageUrl = dto.homepageUrl;
    if (dto.redirectUris !== undefined) app.redirectUris = dto.redirectUris;
    if (dto.scopes !== undefined) {
      const scopes = dto.scopes.filter((scope) => OAUTH_SCOPES.includes(scope));
      if (scopes.length === 0) {
        throw new BadRequestException('No valid scopes requested');
      }
      app.scopes = scopes;
    }
    return this.appsRepository.save(app);
  }

  async deleteApp(developerId: string, appId: string): Promise<void> {
    const app = await this.getOwnedApp(developerId, appId);
    await this.appsRepository.remove(app);
  }

  async rotateSecret(developerId: string, appId: string) {
    const app = await this.getOwnedApp(developerId, appId);
    const clientSecret = randomBytes(32).toString('base64url');
    app.clientSecretHash = sha256(clientSecret);
    await this.appsRepository.save(app);
    return { clientSecret, clientId: app.clientId };
  }

  // User consents: issue a one-time authorization code bound to the PKCE challenge.
  async authorize(
    userId: string,
    appId: string,
    scopes: string[],
    codeChallenge: string,
    codeChallengeMethod = 'S256',
  ): Promise<{ code: string; expiresIn: number; scopes: string[] }> {
    const app = await this.getApp(appId);
    const allowed = scopes.filter((scope) => app.scopes.includes(scope));
    if (allowed.length === 0) {
      throw new BadRequestException('Requested scopes are not granted by this app');
    }
    if (!codeChallenge) {
      throw new BadRequestException('PKCE code_challenge is required');
    }

    const code = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    const auth = this.authorizationsRepository.create({
      app,
      user: await this.usersService.findOneById(userId),
      scopes: allowed,
      codeHash: sha256(code),
      codeExpiresAt: expiresAt,
      codeChallenge,
      codeChallengeMethod,
    });
    await this.authorizationsRepository.save(auth);

    return { code, expiresIn: CODE_TTL_MS / 1000, scopes: allowed };
  }

  // Exchange a one-time code + PKCE verifier for an access token.
  async exchangeToken(
    code: string,
    codeVerifier: string,
    clientId: string,
  ): Promise<{ accessToken: string; tokenType: string; scope: string[]; expiresIn: number }> {
    const auth = await this.authorizationsRepository.findOne({
      where: { codeHash: sha256(code) },
      relations: ['app', 'user'],
    });
    if (!auth || !auth.codeExpiresAt || auth.codeExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }
    if (auth.app.clientId !== clientId) {
      throw new UnauthorizedException('Client does not match the authorization code');
    }
    if (auth.codeChallengeMethod === 'S256') {
      const verifierHash = sha256(codeVerifier);
      if (verifierHash !== auth.codeChallenge) {
        throw new UnauthorizedException('PKCE verification failed');
      }
    } else if (auth.codeChallenge !== codeVerifier) {
      throw new UnauthorizedException('PKCE verification failed');
    }

    const userId = auth.user.id;
    const scopes = auth.scopes;

    // Single-use code — consume it before issuing the token.
    await this.authorizationsRepository.remove(auth);

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, scope: scopes, aud: 'oauth', clientId },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    return { accessToken, tokenType: 'Bearer', scope: scopes, expiresIn: 3600 };
  }

  async introspect(token: string): Promise<{ userId: string; scopes: string[] }> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.aud !== 'oauth') {
        throw new UnauthorizedException('Not an OAuth access token');
      }
      return { userId: payload.sub, scopes: payload.scope ?? [] };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async getUserSummary(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    };
  }

  private async getOwnedApp(developerId: string, appId: string): Promise<OAuthApp> {
    const app = await this.appsRepository.findOne({
      where: { id: appId },
      relations: ['developer'],
    });
    if (!app) {
      throw new NotFoundException('OAuth app not found');
    }
    if (app.developer.id !== developerId) {
      throw new ForbiddenException('You can only manage your own OAuth apps');
    }
    return app;
  }
}
