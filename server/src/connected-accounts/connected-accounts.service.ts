import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectedAccount, ConnectedAccountPlatform } from './entities/connected-account.entity';

@Injectable()
export class ConnectedAccountsService {
  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly repository: Repository<ConnectedAccount>,
  ) {}

  async listForUser(userId: string) {
    const accounts = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return accounts.map((account) => this.toResponse(account));
  }

  async create(
    userId: string,
    data: { platform: string; apiKey?: string; apiSecret?: string; accessToken?: string },
  ) {
    const account = this.repository.create({
      userId,
      platform: data.platform as ConnectedAccountPlatform,
      apiKey: data.apiKey ?? null,
      apiSecret: data.apiSecret ?? null,
      accessToken: data.accessToken ?? null,
      platformUsername: '',
      platformUserId: '',
      isActive: true,
    });
    const saved = await this.repository.save(account);
    return this.toResponse(saved);
  }

  async updateActive(userId: string, id: string, isActive: boolean) {
    const account = await this.repository.findOne({ where: { id, userId } });
    if (!account) {
      throw new NotFoundException('Connected account not found');
    }
    account.isActive = isActive;
    return this.toResponse(await this.repository.save(account));
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException('Connected account not found');
    }
  }

  // Secret fields (apiKey/apiSecret/accessToken) are persisted but never returned.
  private toResponse(account: ConnectedAccount) {
    return {
      id: account.id,
      platform: account.platform,
      platformUsername: account.platformUsername,
      platformUserId: account.platformUserId,
      isActive: account.isActive,
      connectedAt: account.createdAt.toISOString(),
    };
  }
}
