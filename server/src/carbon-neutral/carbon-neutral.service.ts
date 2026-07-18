import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonTransaction, CarbonTransactionType } from './entities/carbon-transaction.entity';

@Injectable()
export class CarbonNeutralService {
  constructor(
    @InjectRepository(CarbonTransaction)
    private readonly transactionRepository: Repository<CarbonTransaction>,
  ) {}

  async createTransaction(
    userId: string,
    data: Partial<CarbonTransaction>,
  ) {
    const transaction = this.transactionRepository.create({
      ...data,
      userId,
    });
    return this.transactionRepository.save(transaction);
  }

  async getUserTransactions(userId: string) {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserCarbonBalance(userId: string) {
    const transactions = await this.getUserTransactions(userId);
    let balance = 0;
    for (const tx of transactions) {
      if (tx.type === CarbonTransactionType.EMISSION) {
        balance -= tx.amount;
      } else if (tx.type === CarbonTransactionType.OFFSET) {
        balance += tx.amount;
      }
    }
    return balance;
  }

  async getTotalStats() {
    const [totalEmissions, totalOffsets] = await Promise.all([
      this.transactionRepository.sum('amount', { type: CarbonTransactionType.EMISSION }),
      this.transactionRepository.sum('amount', { type: CarbonTransactionType.OFFSET }),
    ]);
    return {
      totalEmissions: totalEmissions || 0,
      totalOffsets: totalOffsets || 0,
      net: (totalOffsets || 0) - (totalEmissions || 0),
    };
  }
}
