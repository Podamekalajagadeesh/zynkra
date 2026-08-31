import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

interface BiometricDevice {
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

interface BiometricChallenge {
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
  private readonly biometricDevices = new Map<string, BiometricDevice[]>();
  private readonly biometricChallenges = new Map<string, BiometricChallenge>();

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    const devices = this.biometricDevices.get(userId) || [];

    // Check for duplicate device
    const existingDevice = devices.find(d => d.deviceId === deviceId);
    if (existingDevice) {
      throw new BadRequestException('Device already registered for this user');
    }

    // Hash the biometric data (in production, use more sophisticated hashing)
    const fingerprint = this.hashBiometricData(biometricData);

    const newDevice: BiometricDevice = {
      id: `biom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      userId,
      deviceId,
      deviceName,
      biometricType,
      fingerprint,
      enabled: true,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    devices.push(newDevice);
    this.biometricDevices.set(userId, devices);

    this.logger.log(`Registered ${biometricType} device ${deviceName} for user ${userId}`);

    return newDevice;
  }

  /**
   * Verify biometric authentication
   */
  async verifyBiometricAuthentication(
    userId: string,
    deviceId: string,
    biometricData: Buffer,
  ): Promise<{ verified: boolean; device: BiometricDevice }> {
    const devices = this.biometricDevices.get(userId);
    if (!devices || devices.length === 0) {
      throw new BadRequestException('No biometric devices registered for this user');
    }

    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not registered`);
    }

    if (!device.enabled) {
      throw new BadRequestException('Device is disabled');
    }

    // Verify the biometric data matches (using fuzzy matching for tolerance)
    const fingerprint = this.hashBiometricData(biometricData);
    const verified = this.compareBiometricFingerprints(fingerprint, device.fingerprint);

    if (verified) {
      device.lastUsedAt = new Date();
      device.updatedAt = new Date();
    }

    return { verified, device };
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
    const devices = this.biometricDevices.get(userId) || [];
    return devices.filter(d => d.enabled);
  }

  /**
   * Disable a biometric device
   */
  async disableBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const devices = this.biometricDevices.get(userId);
    if (!devices) {
      throw new NotFoundException('No devices found for this user');
    }

    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.enabled = false;
    device.updatedAt = new Date();

    return { success: true, message: `${device.biometricType} device disabled` };
  }

  /**
   * Enable a biometric device
   */
  async enableBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const devices = this.biometricDevices.get(userId);
    if (!devices) {
      throw new NotFoundException('No devices found for this user');
    }

    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.enabled = true;
    device.updatedAt = new Date();

    return { success: true, message: `${device.biometricType} device enabled` };
  }

  /**
   * Delete a biometric device
   */
  async deleteBiometricDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    const devices = this.biometricDevices.get(userId);
    if (!devices) {
      throw new NotFoundException('No devices found for this user');
    }

    const index = devices.findIndex(d => d.deviceId === deviceId);
    if (index === -1) {
      throw new NotFoundException('Device not found');
    }

    const deletedDevice = devices.splice(index, 1)[0];

    if (devices.length === 0) {
      this.biometricDevices.delete(userId);
    }

    this.logger.log(`Deleted ${deletedDevice.biometricType} device for user ${userId}`);

    return { success: true, message: 'Device deleted successfully' };
  }

  /**
   * Get biometric device status
   */
  async getBiometricDeviceStatus(userId: string, deviceId: string): Promise<BiometricDevice> {
    const devices = this.biometricDevices.get(userId);
    if (!devices) {
      throw new NotFoundException('No devices found for this user');
    }

    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  // Private helper methods

  private hashBiometricData(data: Buffer): string {
    // In production, use a proper cryptographic hash function
    // For now, use a simple base64 representation
    // In real implementation, use bcrypt or argon2 for biometric templates
    return data.toString('base64');
  }

  private compareBiometricFingerprints(fingerprint1: string, fingerprint2: string): boolean {
    // In production, use fuzzy matching (e.g., Levenshtein distance)
    // Allow small variations due to sensor noise
    // This is a simplified comparison
    if (fingerprint1 === fingerprint2) {
      return true;
    }

    // Allow up to 5% difference due to sensor variance
    const distance = this.levenshteinDistance(fingerprint1, fingerprint2);
    const maxDistance = Math.ceil(Math.max(fingerprint1.length, fingerprint2.length) * 0.05);

    return distance <= maxDistance;
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
}
