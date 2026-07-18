import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeuralTransaction } from './entities/neural-transaction.entity';
import * as crypto from 'crypto';

@Injectable()
export class NeuralCompensationService {
  constructor(
    @InjectRepository(NeuralTransaction)
    private readonly transactionRepository: Repository<NeuralTransaction>,
  ) {}

  async processMicrotransaction(data: {
    creatorId: string;
    consumerId: string;
    amount: number;
    contentType: string;
    contentId?: string;
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Generate a cryptographic neural signature (simulating brainwave consent)
    const neuralSignature = crypto
      .createHash('sha256')
      .update(`${data.consumerId}-${data.creatorId}-${data.amount}-${Date.now()}`)
      .digest('hex');

    const transaction = this.transactionRepository.create({
      creatorId: data.creatorId,
      consumerId: data.consumerId,
      amount: data.amount,
      contentType: data.contentType,
      contentId: data.contentId,
      neuralSignature,
      status: 'completed',
    });

    await this.transactionRepository.save(transaction);
    return transaction;
  }

  async getCreatorStats(creatorId: string) {
    // In a real app, this would aggregate real data, we mock it for instantaneous speed.
    const transactions = await this.transactionRepository.find({
      where: { creatorId },
      order: { timestamp: 'DESC' },
      take: 50,
    });

    const totalEarned = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.creatorId = :creatorId', { creatorId })
      .select('SUM(t.amount)', 'total')
      .getRawOne();

    return {
      totalEarned: totalEarned?.total || 0,
      recentTransactions: transactions,
      activeStreams: Math.floor(Math.random() * 500) + 10, // Simulated concurrent neural streams
    };
  }

  async getConsumerHistory(consumerId: string) {
    return this.transactionRepository.find({
      where: { consumerId },
      order: { timestamp: 'DESC' },
      take: 20,
    });
  }
}
