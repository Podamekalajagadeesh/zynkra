import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OneTimePreKey } from './entities/one-time-prekey.entity';
import { SignedPreKey } from './entities/signed-prekey.entity';
import { PreKeyBundle } from './entities/prekey-bundle.entity';

@Injectable()
export class PreKeysService {
  private readonly logger = new Logger(PreKeysService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OneTimePreKey)
    private readonly oneTimePreKeysRepository: Repository<OneTimePreKey>,
    @InjectRepository(SignedPreKey)
    private readonly signedPreKeysRepository: Repository<SignedPreKey>,
    @InjectRepository(PreKeyBundle)
    private readonly preKeyBundlesRepository: Repository<PreKeyBundle>,
  ) {}

  /**
   * Save the user's identity public key and generate their first signed pre-key.
   */
  async uploadIdentityKey(
    userId: string,
    identityKey: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.publicKey = identityKey;
    await this.usersRepository.save(user);
  }

  /**
   * Store a signed pre-key for the user.
   */
  async uploadSignedPreKey(
    userId: string,
    keyId: number,
    publicKey: string,
    signature: string,
  ): Promise<void> {
    const existing = await this.signedPreKeysRepository.findOne({
      where: { userId, keyId },
    });
    if (existing) {
      existing.publicKey = publicKey;
      existing.signature = signature;
      await this.signedPreKeysRepository.save(existing);
    } else {
      const spk = this.signedPreKeysRepository.create({
        userId,
        keyId,
        publicKey,
        signature,
      });
      await this.signedPreKeysRepository.save(spk);
    }
  }

  /**
   * Get the current signed pre-key for a user.
   */
  async getSignedPreKey(
    userId: string,
  ): Promise<{ keyId: number; publicKey: string; signature: string }> {
    const spk = await this.signedPreKeysRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!spk) {
      throw new NotFoundException('No signed pre-key found for this user');
    }
    return { keyId: spk.keyId, publicKey: spk.publicKey, signature: spk.signature };
  }

  /**
   * Upload a batch of one-time pre-keys.
   */
  async uploadOneTimePreKeys(
    userId: string,
    preKeys: Array<{ keyId: number; publicKey: string }>,
  ): Promise<number> {
    const entities = preKeys.map((pk) =>
      this.oneTimePreKeysRepository.create({
        userId,
        keyId: pk.keyId,
        publicKey: pk.publicKey,
      }),
    );

    await this.oneTimePreKeysRepository.save(entities);
    const count = await this.oneTimePreKeysRepository.count({
      where: { userId, isUsed: false },
    });
    return count;
  }

  /**
   * Get a full pre-key bundle for a user, consuming one one-time pre-key if available.
   */
  async getPreKeyBundle(
    userId: string,
  ): Promise<{
    registrationId: number;
    identityKey: string;
    signedPreKey: { keyId: number; publicKey: string; signature: string };
    oneTimePreKey: { keyId: number; publicKey: string } | null;
  }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.publicKey) {
      throw new NotFoundException('User has no identity key');
    }

    const spk = await this.signedPreKeysRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!spk) {
      throw new NotFoundException('No signed pre-key found for this user');
    }

    // Consume one one-time pre-key (first unused)
    const otpk = await this.oneTimePreKeysRepository.findOne({
      where: { userId, isUsed: false },
      order: { createdAt: 'ASC' },
    });

    if (otpk) {
      otpk.isUsed = true;
      await this.oneTimePreKeysRepository.save(otpk);
    }

    return {
      registrationId: 1, // simplified for now
      identityKey: user.publicKey,
      signedPreKey: {
        keyId: spk.keyId,
        publicKey: spk.publicKey,
        signature: spk.signature,
      },
      oneTimePreKey: otpk
        ? { keyId: otpk.keyId, publicKey: otpk.publicKey }
        : null,
    };
  }

  /**
   * Count remaining unused one-time pre-keys for a user.
   */
  async getOneTimePreKeyCount(userId: string): Promise<number> {
    return this.oneTimePreKeysRepository.count({
      where: { userId, isUsed: false },
    });
  }

  /**
   * Upload a pre-key bundle (alternative to separate uploads).
   */
  async uploadPreKeyBundle(
    userId: string,
    bundle: {
      registrationId: number;
      identityKey: string;
      signedPreKey: { keyId: number; publicKey: string; signature: string };
      oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
    },
  ): Promise<void> {
    await this.uploadIdentityKey(userId, bundle.identityKey);

    await this.uploadSignedPreKey(
      userId,
      bundle.signedPreKey.keyId,
      bundle.signedPreKey.publicKey,
      bundle.signedPreKey.signature,
    );

    if (bundle.oneTimePreKeys?.length > 0) {
      await this.uploadOneTimePreKeys(userId, bundle.oneTimePreKeys);
    }

    this.logger.log(
      `Uploaded pre-key bundle for user ${userId}: ` +
      `signedPreKey=${bundle.signedPreKey.keyId}, ` +
      `${bundle.oneTimePreKeys?.length || 0} one-time pre-keys`,
    );
  }
}
