import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OneTimePreKey } from './entities/one-time-prekey.entity';
import { SignedPreKey } from './entities/signed-prekey.entity';
import { PreKeyBundle } from './entities/prekey-bundle.entity';
import { KeyRotationEvent } from './entities/key-rotation-event.entity';

/** Signed pre-keys retained per user: the current one and the previous one. */
const SIGNED_PREKEY_HISTORY = 2;

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
    @InjectRepository(KeyRotationEvent)
    private readonly rotationEventsRepository: Repository<KeyRotationEvent>,
  ) {}

  private async recordRotation(
    userId: string,
    kind: 'identity' | 'signed-prekey' | 'one-time-prekeys',
    keyId: number | null = null,
    detail: string | null = null,
  ): Promise<void> {
    try {
      await this.rotationEventsRepository.save(
        this.rotationEventsRepository.create({ userId, kind, keyId, detail }),
      );
    } catch (error) {
      // The audit trail must never block a key upload.
      this.logger.error(`Failed to record ${kind} rotation for ${userId}`, error);
    }
  }

  /**
   * Save the user's identity public key.
   *
   * Rotation semantics: uploading a *different* key replaces the old one and
   * records an `identity` event so peers can detect the change (the identity
   * key is the root of trust for every existing session — after rotation a
   * peer must re-establish via X3DH rather than keep ratcheting). Re-uploading
   * the same key is a no-op apart from the column write.
   */
  async uploadIdentityKey(
    userId: string,
    identityKey: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const changed = user.publicKey !== identityKey;
    user.publicKey = identityKey;
    await this.usersRepository.save(user);

    if (changed) {
      // An identity rotation invalidates all key material issued under the
      // old identity: one-time pre-keys would hand initiators a public key
      // whose private half no longer exists on any device that can decrypt
      // (new install), and old signed pre-keys no longer verify under the new
      // identity. Purge both — clients always re-upload them right after the
      // identity (bootstrap, syncSelfIdentity, and the bundle flow all do).
      await this.oneTimePreKeysRepository.delete({ userId });
      await this.signedPreKeysRepository.delete({ userId });
      await this.recordRotation(userId, 'identity');
      this.logger.log(
        `Identity key rotated for user ${userId} (pre-keys purged)`,
      );
    }
  }

  /**
   * Store a signed pre-key for the user.
   *
   * Rotation semantics: a *new* keyId becomes the current key and the previous
   * two are retained — the newest for initiators, the previous so a session
   * established moments before the rotation can still be completed. Older rows
   * are pruned; they can never be needed again because any session using them
   * has either finished its X3DH handshake or failed it.
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
      return;
    }

    const spk = this.signedPreKeysRepository.create({
      userId,
      keyId,
      publicKey,
      signature,
    });
    await this.signedPreKeysRepository.save(spk);
    await this.recordRotation(userId, 'signed-prekey', keyId);

    // Prune to current + previous.
    const all = await this.signedPreKeysRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const stale = all.slice(SIGNED_PREKEY_HISTORY);
    if (stale.length > 0) {
      await this.signedPreKeysRepository.remove(stale);
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
   *
   * KeyIds already present (used or unused) are skipped: re-using a keyId with
   * different material would let a peer consume the old row and encrypt to a
   * key the owner no longer holds.
   */
  async uploadOneTimePreKeys(
    userId: string,
    preKeys: Array<{ keyId: number; publicKey: string }>,
  ): Promise<number> {
    if (preKeys.length === 0) return this.getOneTimePreKeyCount(userId);

    const existingIds = await this.oneTimePreKeysRepository.find({
      where: { userId },
      select: ['keyId'],
    });
    const taken = new Set(existingIds.map((k) => k.keyId));
    const fresh = preKeys.filter((pk) => !taken.has(pk.keyId));

    if (fresh.length > 0) {
      const entities = fresh.map((pk) =>
        this.oneTimePreKeysRepository.create({
          userId,
          keyId: pk.keyId,
          publicKey: pk.publicKey,
        }),
      );
      await this.oneTimePreKeysRepository.save(entities);
      await this.recordRotation(
        userId,
        'one-time-prekeys',
        null,
        JSON.stringify({ uploaded: fresh.length, skipped: preKeys.length - fresh.length }),
      );
    }

    return this.getOneTimePreKeyCount(userId);
  }

  /**
   * Get a full pre-key bundle for a user, consuming one one-time pre-key if
   * available.
   *
   * Consumption is claimed inside a transaction with a pessimistic write lock:
   * two peers fetching a bundle at the same instant must not receive the same
   * one-time pre-key, or both sessions would encrypt to a key only one of them
   * can complete — the classic X3DH pre-key race.
   */
  async getPreKeyBundle(
    userId: string,
  ): Promise<{
    registrationId: number;
    identityKey: string;
    signedPreKey: { keyId: number; publicKey: string; signature: string };
    oneTimePreKey: { keyId: number; publicKey: string } | null;
    identityRotatedAt: string | null;
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

    const otpk = await this.oneTimePreKeysRepository.manager.transaction(
      async (manager) => {
        const repo = manager.getRepository(OneTimePreKey);
        const candidate = await repo
          .createQueryBuilder('k')
          .where('k."userId" = :userId AND k."isUsed" = false', { userId })
          .orderBy('k."createdAt"', 'ASC')
          .setLock('pessimistic_write')
          .getOne();
        if (!candidate) return null;
        candidate.isUsed = true;
        await repo.save(candidate);
        return candidate;
      },
    );

    const identityRotatedAt = await this.lastIdentityRotation(userId);

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
      identityRotatedAt,
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
   * Current identity key plus when it last changed — the peer-facing half of
   * rotation detection. A client that cached someone's identity key compares
   * `rotatedAt` (or the key itself) and re-establishes a session on change.
   */
  async getIdentityKeyStatus(
    userId: string,
  ): Promise<{ publicKey: string; rotatedAt: string | null }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.publicKey) {
      throw new NotFoundException('User has no identity key');
    }
    return {
      publicKey: user.publicKey,
      rotatedAt: await this.lastIdentityRotation(userId),
    };
  }

  private async lastIdentityRotation(userId: string): Promise<string | null> {
    const latest = await this.rotationEventsRepository.findOne({
      where: { userId, kind: 'identity' },
      order: { createdAt: 'DESC' },
    });
    return latest ? latest.createdAt.toISOString() : null;
  }

  /**
   * The user's own rotation history (audit + client resync). `since` filters
   * events strictly after the given instant, so a client can poll incrementally.
   */
  async getRotationEvents(
    userId: string,
    since?: Date,
  ): Promise<Array<{ kind: string; keyId: number | null; detail: string | null; createdAt: string }>> {
    const events = await this.rotationEventsRepository.find({
      where: since
        ? { userId, createdAt: MoreThan(since) }
        : { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return events.map((e) => ({
      kind: e.kind,
      keyId: e.keyId,
      detail: e.detail,
      createdAt: e.createdAt.toISOString(),
    }));
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
