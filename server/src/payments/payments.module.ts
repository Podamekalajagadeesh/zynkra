import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PayoutReconciliationService } from './reconciliation.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { User } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction, Payout, User]),
    WalletModule,
    forwardRef(() => WebhooksModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayoutReconciliationService],
  exports: [PaymentsService, PayoutReconciliationService],
})
export class PaymentsModule {}
