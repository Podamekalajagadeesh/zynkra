
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { CommerceService } from './commerce.service';
import { CommerceController } from './commerce.controller';
import { Transaction } from './entities/transaction.entity';
import { Rating } from './entities/rating.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductReview } from './entities/product-review.entity';
import { EscrowTransaction } from './entities/escrow.entity';
import { CheckoutSession } from './entities/checkout-session.entity';
import { User } from '../users/entities/user.entity';
import { Product } from './entities/product.entity';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction, Rating, ProductVariant, User,
      ProductReview, EscrowTransaction, CheckoutSession, Product,
    ]),
    UsersModule,
    WalletModule,
  ],
  providers: [MarketplaceService, CommerceService],
  controllers: [MarketplaceController, CommerceController],
})
export class MarketplaceModule {}