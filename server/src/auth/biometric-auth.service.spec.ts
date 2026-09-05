import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { BiometricAuthService } from './biometric-auth.service';
import { User } from '../users/entities/user.entity';
import { BiometricDeviceEntity } from './entities/biometric-device.entity';

describe('BiometricAuthService', () => {
  let service: BiometricAuthService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let biometricRepository: jest.Mocked<Repository<BiometricDeviceEntity>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BiometricAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
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
      ],
    }).compile();

    service = module.get(BiometricAuthService);
    usersRepository = module.get(getRepositoryToken(User));
    biometricRepository = module.get(getRepositoryToken(BiometricDeviceEntity));
  });

  it('persists a biometric device and verifies it by matching template', async () => {
    const user = { id: 'user-1', email: 'demo@example.com' } as User;
    usersRepository.findOne.mockResolvedValue(user);
    const savedDevice = {
      id: 'biometric-1',
      userId: 'user-1',
      deviceId: 'device-1',
      deviceName: 'Pixel 9',
      biometricType: 'fingerprint' as const,
      fingerprint: createHash('sha256').update(Buffer.from('template-data')).digest('hex'),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: new Date(),
    };

    let hasSavedDevice = false;

    biometricRepository.save.mockImplementation(async (entity) => {
      const next = {
        ...savedDevice,
        ...entity,
      };
      hasSavedDevice = true;
      return next as any;
    });
    biometricRepository.find.mockResolvedValue([]);
    biometricRepository.findOne.mockImplementation(async (criteria: any) => {
      const where = criteria?.where;
      if (where && typeof where === 'object' && where.userId === 'user-1' && where.deviceId === 'device-1') {
        return hasSavedDevice ? (savedDevice as any) : null;
      }
      return null;
    });

    const device = await service.registerBiometricDevice(
      'user-1',
      'device-1',
      'Pixel 9',
      'fingerprint',
      Buffer.from('template-data'),
    );

    expect(device.deviceId).toBe('device-1');
    expect(biometricRepository.save).toHaveBeenCalled();

    const challenge = await service.generateBiometricChallenge('user-1');
    const result = await service.verifyBiometricChallenge(
      challenge.challengeId,
      'user-1',
      'device-1',
      Buffer.from('template-data'),
    );

    expect(result.success).toBe(true);
  });
});
