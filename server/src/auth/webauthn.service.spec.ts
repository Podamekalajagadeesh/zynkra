import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { WebauthnService } from './webauthn.service';
import { Authenticator } from './entities/authenticator.entity';
import { User } from '../users/entities/user.entity';

jest.mock('@simplewebauthn/server', () => {
  const actual = jest.requireActual('@simplewebauthn/server');
  return {
    ...actual,
    generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'mock-challenge' }),
    generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'mock-challenge' }),
  };
});

import { generateAuthenticationOptions } from '@simplewebauthn/server';

const mockGenerateAuthenticationOptions = generateAuthenticationOptions as jest.Mock;

describe('WebauthnService', () => {
  let service: WebauthnService;
  let authenticatorsRepo: jest.Mocked<Repository<Authenticator>>;

  const user = { id: 'user-1' } as User;

  function makeAuthenticator(id: string, transports: string): Authenticator {
    return {
      id,
      credentialID: Buffer.from(`cred-${id}`).toString('base64'),
      credentialPublicKey: 'pubkey',
      counter: 1,
      transports,
      user,
    } as unknown as Authenticator;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGenerateAuthenticationOptions.mockResolvedValue({ challenge: 'mock-challenge' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebauthnService,
        {
          provide: getRepositoryToken(Authenticator),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<WebauthnService>(WebauthnService);
    authenticatorsRepo = module.get(getRepositoryToken(Authenticator)) as jest.Mocked<Repository<Authenticator>>;
  });

  describe('getAuthenticationOptions', () => {
    it('requests platform authenticators when biometric is requested', async () => {
      authenticatorsRepo.find.mockResolvedValue([
        makeAuthenticator('1', 'internal,hybrid'),
        makeAuthenticator('2', 'usb'),
      ]);

      await service.getAuthenticationOptions(user, { biometric: true });

      const args = mockGenerateAuthenticationOptions.mock.calls[0][0];
      expect(args.userVerification).toBe('required');
      expect(args.allowCredentials).toHaveLength(1);
      expect(args.allowCredentials[0].transports).toEqual(['internal', 'hybrid']);
    });

    it('falls back to all credentials when none are labelled internal', async () => {
      authenticatorsRepo.find.mockResolvedValue([makeAuthenticator('1', 'usb')]);

      await service.getAuthenticationOptions(user, { biometric: true });

      const args = mockGenerateAuthenticationOptions.mock.calls[0][0];
      expect(args.userVerification).toBe('required');
      expect(args.allowCredentials).toHaveLength(1);
    });

    it('does not restrict credentials or force verification for a regular passkey login', async () => {
      authenticatorsRepo.find.mockResolvedValue([makeAuthenticator('1', 'internal')]);

      await service.getAuthenticationOptions(user);

      const args = mockGenerateAuthenticationOptions.mock.calls[0][0];
      expect(args.allowCredentials).toHaveLength(1);
      expect(args.userVerification).toBeUndefined();
    });
  });

  it('derives the WebAuthn relying party and origin from the public app URL', async () => {
    const repo = { find: jest.fn().mockResolvedValue([]) } as any;
    const config = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'CLIENT_URL') return 'https://app.zynkra.com';
        if (key === 'WEBAUTHN_RP_ID') return undefined;
        if (key === 'WEBAUTHN_ORIGIN') return undefined;
        return defaultValue;
      }),
    } as any;

    const configuredService = new WebauthnService(repo, config);
    await configuredService.getRegistrationOptions({ id: 'user-1', email: 'test@example.com' } as any);

    const registrationArgs = (require('@simplewebauthn/server').generateRegistrationOptions as jest.Mock).mock.calls.at(-1)?.[0];
    expect(registrationArgs.rpID).toBe('app.zynkra.com');
    expect(registrationArgs.userName).toBe('test@example.com');
  });

  it('matches browser base64url credential IDs to the stored base64 credential IDs during passkey login', async () => {
    const credentialBytes = Uint8Array.from([1, 2, 3, 255, 128]);
    const storedCredentialId = Buffer.from(credentialBytes).toString('base64');
    const browserCredentialId = Buffer.from(credentialBytes).toString('base64url');
    const storedAuthenticator = {
      id: 'auth-1',
      credentialID: storedCredentialId,
      credentialPublicKey: 'pubkey',
      counter: 1,
      transports: 'internal',
      user,
    } as unknown as Authenticator;

    authenticatorsRepo.findOne.mockResolvedValue(storedAuthenticator);
    authenticatorsRepo.find.mockResolvedValue([storedAuthenticator]);

    const verification = jest.spyOn(require('@simplewebauthn/server'), 'verifyAuthenticationResponse').mockResolvedValue({
      verified: true,
      authenticationInfo: { credentialID: credentialBytes, newCounter: 2 },
    } as any);

    await expect(service.verifyAuthentication(user, { id: browserCredentialId }, 'challenge-123')).resolves.toEqual({
      verified: true,
      authenticationInfo: { credentialID: credentialBytes, newCounter: 2 },
    });

    expect(authenticatorsRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: user.id }, credentialID: service['normalizeCredentialId'](browserCredentialId) },
    });

    verification.mockRestore();
  });
});
