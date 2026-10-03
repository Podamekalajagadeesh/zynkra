import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { BiometricAuthService } from './biometric-auth.service';
import { User } from '../users/entities/user.entity';
import { BiometricDeviceEntity } from './entities/biometric-device.entity';
import { BiometricChallengeEntity } from './entities/biometric-challenge.entity';

const TEMPLATE = Buffer.from('template-data');
const TEMPLATE_HASH = createHash('sha256').update(TEMPLATE).digest('hex');

describe('BiometricAuthService', () => {
  let service: BiometricAuthService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let biometricRepository: jest.Mocked<Repository<BiometricDeviceEntity>>;
  let challengeRepository: jest.Mocked<Repository<BiometricChallengeEntity>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BiometricAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(BiometricDeviceEntity),
          useValue: {
            create: jest.fn((entity) => entity),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BiometricChallengeEntity),
          useValue: {
            create: jest.fn((entity) => ({ id: 'challenge-1', ...entity })),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BiometricAuthService);
    usersRepository = module.get(getRepositoryToken(User));
    biometricRepository = module.get(getRepositoryToken(BiometricDeviceEntity));
    challengeRepository = module.get(getRepositoryToken(BiometricChallengeEntity));
  });

  describe('device registration and possession re-verification', () => {
    let hasSavedDevice = false;

    beforeEach(() => {
      usersRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
      hasSavedDevice = false;

      biometricRepository.save.mockImplementation(async (entity) => {
        const next = {
          id: 'biometric-1',
          userId: 'user-1',
          deviceId: 'device-1',
          deviceName: 'Pixel 9',
          biometricType: 'fingerprint' as const,
          fingerprint: TEMPLATE_HASH,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: new Date(),
          ...entity,
        };
        hasSavedDevice = true;
        return next as any;
      });
      biometricRepository.find.mockResolvedValue([]);
      biometricRepository.findOne.mockImplementation(async (criteria: any) => {
        const where = criteria?.where;
        if (where?.userId === 'user-1' && where?.deviceId === 'device-1') {
          return hasSavedDevice
            ? ({
                id: 'biometric-1',
                userId: 'user-1',
                deviceId: 'device-1',
                deviceName: 'Pixel 9',
                biometricType: 'fingerprint',
                fingerprint: TEMPLATE_HASH,
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastUsedAt: new Date(),
              } as any)
            : null;
        }
        return null;
      });
    });

    it('registers a device and accepts the matching template', async () => {
      const device = await service.registerBiometricDevice(
        'user-1',
        'device-1',
        'Pixel 9',
        'fingerprint',
        TEMPLATE,
      );

      expect(device.deviceId).toBe('device-1');
      const { verified } = await service.verifyBiometricAuthentication('user-1', 'device-1', TEMPLATE);
      expect(verified).toBe(true);
    });

    it('rejects a different template', async () => {
      await service.registerBiometricDevice('user-1', 'device-1', 'Pixel 9', 'fingerprint', TEMPLATE);
      const { verified } = await service.verifyBiometricAuthentication(
        'user-1',
        'device-1',
        Buffer.from('different-data'),
      );
      expect(verified).toBe(false);
    });

    it('rejects a template that differs by a single hex character', async () => {
      // Regression: comparison was `similarity >= 0.97` over two 64-char hex
      // digests, which permits a Hamming distance of 1 — so a hash off by one
      // character verified. Fuzzy matching is meaningless on a digest.
      await service.registerBiometricDevice('user-1', 'device-1', 'Pixel 9', 'fingerprint', TEMPLATE);

      const flipped = `${TEMPLATE_HASH.slice(0, -1)}${TEMPLATE_HASH.endsWith('a') ? 'b' : 'a'}`;
      expect(flipped).not.toBe(TEMPLATE_HASH);
      expect(flipped).toHaveLength(TEMPLATE_HASH.length);

      // Drive the comparison directly through the public verify path by
      // presenting data that hashes to the flipped digest is not possible, so
      // assert on the private comparator instead.
      const compare = (service as any).compareBiometricFingerprints.bind(service);
      expect(compare(TEMPLATE_HASH, flipped)).toBe(false);
      expect(compare(TEMPLATE_HASH, TEMPLATE_HASH)).toBe(true);
    });

    it('refuses to match two empty digests', async () => {
      const compare = (service as any).compareBiometricFingerprints.bind(service);
      expect(compare('', '')).toBe(false);
    });

    it('refuses digests of differing length', async () => {
      const compare = (service as any).compareBiometricFingerprints.bind(service);
      expect(compare(TEMPLATE_HASH, TEMPLATE_HASH.slice(0, 10))).toBe(false);
    });
  });

  describe('challenges', () => {
    beforeEach(() => {
      usersRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
    });

    it('generates a 64-hex-character challenge from a CSPRNG', async () => {
      challengeRepository.save.mockImplementation(async (e: any) => e);
      const { challenge } = await service.generateBiometricChallenge('user-1', 'device-1');
      expect(challenge).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces a different challenge each time', async () => {
      challengeRepository.save.mockImplementation(async (e: any) => e);
      const a = await service.generateBiometricChallenge('user-1', 'device-1');
      const b = await service.generateBiometricChallenge('user-1', 'device-1');
      expect(a.challenge).not.toBe(b.challenge);
    });

    it('persists the challenge rather than holding it in memory', async () => {
      challengeRepository.save.mockImplementation(async (e: any) => e);
      await service.generateBiometricChallenge('user-1', 'device-1');
      expect(challengeRepository.save).toHaveBeenCalled();
      expect(challengeRepository.create).toHaveBeenCalled();
    });

    it('rejects a challenge belonging to another user', async () => {
      challengeRepository.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'someone-else',
        challenge: 'x',
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      } as any);

      await expect(
        service.verifyBiometricChallenge('c1', 'user-1', 'device-1', TEMPLATE),
      ).rejects.toThrow(/does not belong/);
    });

    it('rejects an expired challenge and deletes it', async () => {
      challengeRepository.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        challenge: 'x',
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      } as any);

      await expect(
        service.verifyBiometricChallenge('c1', 'user-1', 'device-1', TEMPLATE),
      ).rejects.toThrow(/expired/i);
      expect(challengeRepository.delete).toHaveBeenCalledWith('c1');
    });

    it('enforces the attempt ceiling', async () => {
      challengeRepository.findOne.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        challenge: 'x',
        attempts: 3,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      } as any);

      await expect(
        service.verifyBiometricChallenge('c1', 'user-1', 'device-1', TEMPLATE),
      ).rejects.toThrow(/Maximum verification attempts/);
    });
  });
});
