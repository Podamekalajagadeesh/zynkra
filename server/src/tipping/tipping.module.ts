import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TippingService } from './tipping.service';
import { TippingController } from './tipping.controller';
import { Tip } from './entities/tip.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ReputationModule } from '../reputation/reputation.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tip, User, Post]),
    ReputationModule,
    PaymentsModule,
    WalletModule,
  ],
  providers: [TippingService],
  controllers: [TippingController],
  exports: [TippingService],
})
export class TippingModule {}
