import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { IdentityKey } from './entities/identity-key.entity';
import { PreKey } from './entities/pre-key.entity';
import { SignedPreKey } from './entities/signed-pre-key.entity';

@Injectable()
export class CryptoService {
  constructor(
    @InjectRepository(IdentityKey)
    private identityKeyRepository: Repository<IdentityKey>,
    @InjectRepository(PreKey)
    private preKeyRepository: Repository<PreKey>,
    @InjectRepository(SignedPreKey)
    private signedPreKeyRepository: Repository<SignedPreKey>,
  ) {}

  async saveIdentityKey(user: User, registrationId: number, publicKey: string): Promise<IdentityKey> {
    const newIdentityKey = this.identityKeyRepository.create({
      user,
      registrationId,
      publicKey,
    });
    return this.identityKeyRepository.save(newIdentityKey);
  }

  async savePreKey(user: User, keyId: number, publicKey: string): Promise<PreKey> {
    const newPreKey = this.preKeyRepository.create({
      user,
      keyId,
      publicKey,
    });
    return this.preKeyRepository.save(newPreKey);
  }

  async saveSignedPreKey(user: User, keyId: number, publicKey: string, signature: string): Promise<SignedPreKey> {
    const newSignedPreKey = this.signedPreKeyRepository.create({
      user,
      keyId,
      publicKey,
      signature,
    });
    return this.signedPreKeyRepository.save(newSignedPreKey);
  }

  async getKeyBundle(userId: string): Promise<any> {
    const identityKey = await this.identityKeyRepository.findOne({ where: { user: { id: userId } } });
    const preKey = await this.preKeyRepository.findOne({ where: { user: { id: userId } } });
    const signedPreKey = await this.signedPreKeyRepository.findOne({ where: { user: { id: userId } } });

    return {
      identityKey: identityKey ? { registrationId: identityKey.registrationId, publicKey: identityKey.publicKey } : null,
      preKey: preKey ? { keyId: preKey.keyId, publicKey: preKey.publicKey } : null,
      signedPreKey: signedPreKey ? { keyId: signedPreKey.keyId, publicKey: signedPreKey.publicKey, signature: signedPreKey.signature } : null,
    };
  }
}