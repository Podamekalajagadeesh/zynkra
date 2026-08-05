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
});
