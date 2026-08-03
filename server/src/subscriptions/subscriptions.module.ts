import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import {
  SubscriptionBundle,
  SubscriptionBundleTier,
} from './entities/subscription-bundle.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BundlesController } from './bundles.controller';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionTier,
      SubscriptionBundle,
      SubscriptionBundleTier,
    ]),
    UsersModule,
    PaymentsModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController, BundlesController],
})
export class SubscriptionsModule {}