import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrossWorldTrade, TradeStatus } from './entities/cross-world-trade.entity';

@Injectable()
export class CrossWorldTradingService {
  constructor(
    @InjectRepository(CrossWorldTrade)
    private readonly tradeRepository: Repository<CrossWorldTrade>,
  ) {}

  async createTrade(sellerId: string, data: Partial<CrossWorldTrade>) {
    const trade = this.tradeRepository.create({
      ...data,
      sellerId,
      status: TradeStatus.PENDING,
    });
    return this.tradeRepository.save(trade);
  }

  async getAllTrades() {
    return this.tradeRepository.find({
      where: { status: TradeStatus.PENDING },
      relations: ['seller'],
    });
  }

  async getTradeById(id: string) {
    const trade = await this.tradeRepository.findOne({
      where: { id },
      relations: ['seller', 'buyer'],
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }
    return trade;
  }

  async acceptTrade(id: string, buyerId: string) {
    const trade = await this.getTradeById(id);
    trade.buyerId = buyerId;
    trade.status = TradeStatus.COMPLETED;
    return this.tradeRepository.save(trade);
  }

  async cancelTrade(id: string, userId: string) {
    const trade = await this.getTradeById(id);
    if (trade.sellerId !== userId) {
      throw new ForbiddenException('Only seller can cancel this trade');
    }
    trade.status = TradeStatus.CANCELLED;
    return this.tradeRepository.save(trade);
  }

  async getUserTrades(userId: string) {
    return this.tradeRepository.find({
      where: [
        { sellerId: userId },
        { buyerId: userId },
      ],
      relations: ['seller', 'buyer'],
      order: { createdAt: 'DESC' },
    });
  }
}
