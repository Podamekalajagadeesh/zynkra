import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { User } from '../users/entities/user.entity';
import { BiometricDeviceEntity } from './entities/biometric-device.entity';

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

@Injectable()
export class BiometricAuthService {
  private readonly logger = new Logger(BiometricAuthService.name);
  private readonly biometricChallenges = new Map<string, BiometricChallenge>();

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(BiometricDeviceEntity)
    private readonly biometricDeviceRepository: Repository<BiometricDeviceEntity>,
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
   * Verify biometric authentication
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
   * Generate a biometric challenge for authentication
   */
  async generateBiometricChallenge(userId: string): Promise<{ challengeId: string; challenge: string; expiresIn: number }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const challenge = this.generateRandomChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const challengeRecord: BiometricChallenge = {
      id: `chal-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      userId,
      challenge,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.biometricChallenges.set(challengeRecord.id, challengeRecord);

    return {
      challengeId: challengeRecord.id,
      challenge,
      expiresIn: 300, // 5 minutes in seconds
    };
  }

  /**
   * Verify a biometric challenge
   */
  async verifyBiometricChallenge(
    challengeId: string,
    userId: string,
    deviceId: string,
    biometricData: Buffer,
  ): Promise<{ success: boolean; message: string }> {
    const challenge = this.biometricChallenges.get(challengeId);
    if (!challenge) {
      throw new NotFoundException('Challenge not found or expired');
    }

    if (challenge.userId !== userId) {
      throw new BadRequestException('Challenge does not belong to this user');
    }

    if (challenge.expiresAt < new Date()) {
      this.biometricChallenges.delete(challengeId);
      throw new BadRequestException('Challenge has expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.biometricChallenges.delete(challengeId);
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    challenge.attempts++;

    const { verified } = await this.verifyBiometricAuthentication(userId, deviceId, biometricData);

    if (!verified) {
      if (challenge.attempts >= challenge.maxAttempts) {
        this.biometricChallenges.delete(challengeId);
      }
      return { success: false, message: `Verification failed. ${challenge.maxAttempts - challenge.attempts} attempts remaining.` };
    }

    this.biometricChallenges.delete(challengeId);
    return { success: true, message: 'Biometric authentication successful' };
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

  private compareBiometricFingerprints(fingerprint1: string, fingerprint2: string): boolean {
    if (fingerprint1 === fingerprint2) {
      return true;
    }

    const maxLength = Math.max(fingerprint1.length, fingerprint2.length);
    if (maxLength === 0) {
      return true;
    }

    const distance = this.levenshteinDistance(fingerprint1, fingerprint2);
    const similarity = 1 - (distance / maxLength);
    return similarity >= 0.97;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
      }
    }

    return track[str2.length][str1.length];
  }

  private generateRandomChallenge(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
