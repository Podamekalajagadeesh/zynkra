import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, Payout]), WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}