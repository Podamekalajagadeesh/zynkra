import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrossWorldTradingService } from './cross-world-trading.service';
import { CrossWorldTradingController } from './cross-world-trading.controller';
import { CrossWorldTrade } from './entities/cross-world-trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CrossWorldTrade])],
  controllers: [CrossWorldTradingController],
  providers: [CrossWorldTradingService],
})
export class CrossWorldTradingModule {}
