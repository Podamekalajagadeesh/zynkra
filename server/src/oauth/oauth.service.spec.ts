import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { OAuthService } from './oauth.service';
import { OAuthApp } from './entities/oauth-app.entity';
import { OAuthAuthorization } from './entities/oauth-authorization.entity';
import { UsersService } from '../users/users.service';

const sha256 = (input: string) =>
  createHash('sha256').update(input).digest('base64url');

describe('OAuthService', () => {
  let service: OAuthService;
  let appsRepo: jest.Mocked<any>;
  let authRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;
  let jwtService: jest.Mocked<any>;

  const verifier = 'a-very-long-pkce-verifier-string-0123456789';
  const challenge = sha256(verifier);
  const app = { id: 'app-1', clientId: 'client-1', scopes: ['read_profile'] };
  const auth = {
    id: 'auth-1',
    app,
    user: { id: 'user-1' },
    scopes: ['read_profile'],
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
    codeExpiresAt: new Date(Date.now() + 60_000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: getRepositoryToken(OAuthApp),
          useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: getRepositoryToken(OAuthAuthorization),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token'), verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    appsRepo = module.get(getRepositoryToken(OAuthApp));
    authRepo = module.get(getRepositoryToken(OAuthAuthorization));
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('exchangeToken', () => {
    it('issues a token with the matching PKCE verifier', async () => {
      authRepo.findOne.mockResolvedValue(auth);
      authRepo.remove.mockResolvedValue(undefined);

      const result = await service.exchangeToken('code', verifier, 'client-1');

      expect(result.accessToken).toBe('jwt-token');
      expect(result.scope).toEqual(['read_profile']);
      expect(authRepo.remove).toHaveBeenCalledWith(auth); // single-use
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ aud: 'oauth', clientId: 'client-1' }),
        expect.anything(),
      );
    });

    it('rejects a PKCE verifier mismatch', async () => {
      authRepo.findOne.mockResolvedValue(auth);

      await expect(
        service.exchangeToken('code', 'wrong-verifier', 'client-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired code', async () => {
      authRepo.findOne.mockResolvedValue({
        ...auth,
        codeExpiresAt: new Date(Date.now() - 10_000),
      });

      await expect(
        service.exchangeToken('code', verifier, 'client-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a code used with the wrong client', async () => {
      authRepo.findOne.mockResolvedValue(auth);

      await expect(
        service.exchangeToken('code', verifier, 'client-other'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createApp', () => {
    it('returns the plaintext secret exactly once and stores a hash', async () => {
      usersService.findOneById.mockResolvedValue({ id: 'dev-1' });
      appsRepo.create.mockImplementation((data) => data);
      appsRepo.save.mockImplementation((data) => data);

      const result = await service.createApp('dev-1', {
        name: 'My app',
        redirectUris: ['https://example.com/cb'],
        scopes: ['read_profile', 'read_posts'],
      });

      expect(result.clientSecret).toBeTruthy();
      expect(result.clientSecret).not.toBe(result.clientSecretHash);
      expect(result.scopes).toEqual(['read_profile', 'read_posts']);
    });
  });
});
