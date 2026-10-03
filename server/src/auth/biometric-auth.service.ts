import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { User } from '../users/entities/user.entity';
import { BiometricDeviceEntity } from './entities/biometric-device.entity';
import { BiometricChallengeEntity } from './entities/biometric-challenge.entity';

export interface BiometricDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  fingerprint: string; // hashed biometric data
  enabled: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BiometricChallenge {
  id: string;
  userId: string;
  challenge: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/**
 * @deprecated REMOVED FROM THE RUNNING APP — do not wire this back up.
 *
 * This service and the `biometric_devices` / `biometric_challenges` tables were
 * removed from `auth.module.ts`. Reasons:
 *
 *  1. It duplicated what `/auth/webauthn/*` (passkeys) already does correctly,
 *     on top of `@simplewebauthn/server` with an authenticator store and
 *     signature counters.
 *  2. It had **no callers**. The five client wrappers in `lib/api.ts` that would
 *     have called it had zero importers; passkeys replaced the UI entirely.
 *  3. It was **broken on a clean database**: `biometric_devices` never had a
 *     migration, and `synchronize` is off, so those routes could not have worked.
 *  4. It was not authentication. The "fingerprint" was a SHA-256 of bytes the
 *     *client* supplied at registration, so the client could always reproduce
 *     it — the same trust level as re-sending a password. Its verification
 *     endpoint issued no token and could not start a session.
 *
 * The file is left on disk only as a record of the decision. Use
 * `WebauthnService` for device-bound authentication.
 */
@Injectable()
export class BiometricAuthService {
  private readonly logger = new Logger(BiometricAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(BiometricDeviceEntity)
    private readonly biometricDeviceRepository: Repository<BiometricDeviceEntity>,
    @InjectRepository(BiometricChallengeEntity)
    private readonly biometricChallengeRepository: Repository<BiometricChallengeEntity>,
  ) {}

  /**
   * Register a biometric device for a user
   */
  async registerBiometricDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    biometricType: 'fingerprint' | 'face' | 'iris',
    biometricData: Buffer,
  ): Promise<BiometricDevice> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const existingDevice = await this.biometricDeviceRepository.findOne({
      where: { userId, deviceId },
    });
    if (existingDevice) {
      throw new BadRequestException('Device already registered for this user');
    }

    const fingerprint = this.hashBiometricData(biometricData);

    const newEntity = this.biometricDeviceRepository.create({
      user: { id: userId } as User,
      userId,
      deviceId,
      deviceName,
      biometricType,
      fingerprint,
      enabled: true,
      lastUsedAt: new Date(),
    });

    const saved = await this.biometricDeviceRepository.save(newEntity);

    this.logger.log(`Registered ${biometricType} device ${deviceName} for user ${userId}`);

    return this.toBiometricDevice(saved);
  }

  /**
   * Re-confirm possession of a registered device's biometric blob.
   *
   * ⚠️  This is NOT biometric authentication. The blob is whatever the client
   * sent at registration, so the client can always reproduce it — this proves
   * the same trust level as re-sending a password. See the class docstring, and
   * use `/auth/webauthn/*` for real device-bound authentication.
   */
  async verifyBiometricAuthentication(
    userId: string,
    deviceId: string,
    biometricData: Buffer,
  ): Promise<{ verified: boolean; device: BiometricDevice }> {
    const deviceEntity = await this.biometricDeviceRepository.findOne({
      where: { userId, deviceId },
    });

    if (!deviceEntity) {
      throw new NotFoundException(`Device ${deviceId} not registered`);
    }

    if (!deviceEntity.enabled) {
      throw new BadRequestException('Device is disabled');
    }

    const fingerprint = this.hashBiometricData(biometricData);
    const verified = this.compareBiometricFingerprints(fingerprint, deviceEntity.fingerprint);

    if (verified) {
      deviceEntity.lastUsedAt = new Date();
      await this.biometricDeviceRepository.save(deviceEntity);
    }

    return { verified, device: this.toBiometricDevice(deviceEntity) };
  }

  /**
   * Generate a device-verification challenge.
   *
   * This is a re-confirmation challenge for an already-authenticated session, not
   * a login nonce. It is persisted so it survives a restart and is visible to
   * every instance.
   */
  async generateBiometricChallenge(
    userId: string,
    deviceId?: string,
  ): Promise<{ challengeId: string; challenge: string; expiresIn: number }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // randomBytes, not Math.random(): a predictable challenge is not a challenge.
    const challenge = randomBytes(32).toString('hex');
    const record = this.biometricChallengeRepository.create({
      user: { id: userId } as User,
      userId,
      deviceId: deviceId ?? '',
      challenge,
      attempts: 0,
      maxAttempts: 3,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    });

    const saved = await this.biometricChallengeRepository.save(record);

    return {
      challengeId: saved.id,
      challenge,
      expiresIn: 300,
    };
  }

  /**
   * Verify a device-verification challenge. Returns a boolean; does NOT issue a
   * token and does NOT establish a session.
   */
  async verifyBiometricChallenge(
    challengeId: string,
    userId: string,
    deviceId: string,
    biometricData: Buffer,
  ): Promise<{ success: boolean; message: string }> {
    const challenge = await this.biometricChallengeRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found or expired');
    }

    if (challenge.userId !== userId) {
      throw new BadRequestException('Challenge does not belong to this user');
    }

    if (challenge.expiresAt < new Date()) {
      await this.biometricChallengeRepository.delete(challengeId);
      throw new BadRequestException('Challenge has expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.biometricChallengeRepository.delete(challengeId);
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    challenge.attempts += 1;
    await this.biometricChallengeRepository.save(challenge);

    const { verified } = await this.verifyBiometricAuthentication(userId, deviceId, biometricData);

    if (!verified) {
      if (challenge.attempts >= challenge.maxAttempts) {
        await this.biometricChallengeRepository.delete(challengeId);
      }
      return {
        success: false,
        message: `Verification failed. ${challenge.maxAttempts - challenge.attempts} attempts remaining.`,
      };
    }

    await this.biometricChallengeRepository.delete(challengeId);
    return { success: true, message: 'Device verification successful' };
  }

  /**
   * List biometric devices for a user
   */
  async listBiometricDevices(userId: string): Promise<BiometricDevice[]> {
    const deviceEntities = await this.biometricDeviceRepository.find({
      where: { userId, enabled: true },
      order: { createdAt: 'DESC' },
    });

    return deviceEntities.map((device) => this.toBiometricDevice(device));
  }

  /**
   * Disable a biometric device
   */
  async disableBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const device = await this.biometricDeviceRepository.findOne({ where: { userId, deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.enabled = false;
    await this.biometricDeviceRepository.save(device);

    return { success: true, message: `${device.biometricType} device disabled` };
  }

  /**
   * Enable a biometric device
   */
  async enableBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const device = await this.biometricDeviceRepository.findOne({ where: { userId, deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.enabled = true;
    await this.biometricDeviceRepository.save(device);

    return { success: true, message: `${device.biometricType} device enabled` };
  }

  /**
   * Delete a biometric device
   */
  async deleteBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const device = await this.biometricDeviceRepository.findOne({ where: { userId, deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.biometricDeviceRepository.delete(device.id);
    this.logger.log(`Deleted ${device.biometricType} device for user ${userId}`);

    return { success: true, message: 'Device deleted successfully' };
  }

  /**
   * Get biometric device status
   */
  async getBiometricDeviceStatus(userId: string, deviceId: string): Promise<BiometricDevice> {
    const device = await this.biometricDeviceRepository.findOne({ where: { userId, deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.toBiometricDevice(device);
  }

  // Private helper methods

  private hashBiometricData(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compare two SHA-256 hex digests.
   *
   * This previously accepted anything within 97% Levenshtein similarity. That
   * rule is meaningful when matching noisy *raw* fingerprint images, but these
   * are fixed-length hex hashes: with maxLength 64, a threshold of 0.97 permits
   * a Hamming distance of up to 1, so a hash differing by a single character
   * verified successfully. Fuzzy matching has no meaning on a digest, so this is
   * now an exact, constant-time comparison.
   */
  private compareBiometricFingerprints(fingerprint1: string, fingerprint2: string): boolean {
    const a = Buffer.from(fingerprint1, 'utf8');
    const b = Buffer.from(fingerprint2, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    if (a.length === 0) {
      // Two empty digests are not a valid registration; refuse rather than pass.
      return false;
    }
    return timingSafeEqual(a, b);
  }

  private toBiometricDevice(entity: BiometricDeviceEntity): BiometricDevice {
    return {
      id: entity.id,
      userId: entity.userId,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      biometricType: entity.biometricType,
      fingerprint: entity.fingerprint,
      enabled: entity.enabled,
      lastUsedAt: entity.lastUsedAt ?? new Date(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
