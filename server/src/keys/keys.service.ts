import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async savePublicKey(userId: string, publicKey: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.publicKey = publicKey;
    return this.usersRepository.save(user);
  }

  async getPublicKey(userId: string): Promise<{ publicKey: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.publicKey) {
      throw new NotFoundException('Public key not found for this user');
    }

    return { publicKey: user.publicKey };
  }
}