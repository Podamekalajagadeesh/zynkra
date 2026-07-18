import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './entities/token.entity';
import { Balance } from './entities/balance.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TokenService implements OnModuleInit {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.createPlatformToken();
  }

  private async createPlatformToken() {
    const existingToken = await this.tokenRepository.findOne({ where: { symbol: '$ZYNK' } });
    if (existingToken) {
      return;
    }

    const platformOwner = await this.usersService.findOrCreatePlatformUser();

    const token = this.tokenRepository.create({
      name: 'Zynkra',
      symbol: '$ZYNK',
      totalSupply: 1_000_000_000,
      owner: platformOwner,
    });

    await this.tokenRepository.save(token);

    const ownerBalance = this.balanceRepository.create({
      user: platformOwner,
      token,
      amount: token.totalSupply,
    });

    await this.balanceRepository.save(ownerBalance);
  }

  async getBalance(user: User, tokenSymbol: string): Promise<Balance> {
    return this.balanceRepository.findOne({
      where: {
        user: { id: user.id },
        token: { symbol: tokenSymbol },
      },
      relations: ['token'],
    });
  }

  async transfer(from: User, to: User, tokenSymbol: string, amount: number): Promise<void> {
    const token = await this.tokenRepository.findOne({ where: { symbol: tokenSymbol } });
    if (!token) {
      throw new Error('Token not found');
    }

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    const fromBalance = await this.getBalance(from, tokenSymbol);
    if (!fromBalance || fromBalance.amount < amount) {
      throw new Error('Insufficient funds');
    }

    let toBalance = await this.getBalance(to, tokenSymbol);
    if (!toBalance) {
      toBalance = this.balanceRepository.create({
        user: to,
        token,
        amount: 0,
      });
    }

    fromBalance.amount -= amount;
    toBalance.amount += amount;

    await this.balanceRepository.save([fromBalance, toBalance]);
  }

  async reward(user: User, tokenSymbol: string, amount: number): Promise<void> {
    const platformOwner = await this.usersService.findOrCreatePlatformUser();
    await this.transfer(platformOwner, user, tokenSymbol, amount);
  }
}