import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, SubscriptionTier]), UsersModule, PaymentsModule],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}