
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { Transaction } from './entities/transaction.entity';
import { Rating } from './entities/rating.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // ProductVariant must be registered somewhere reachable from AppModule:
    // OrderItem (AnalyticsModule) relates to it, and autoLoadEntities only
    // sees entities passed to forFeature. OrdersModule/ProductsModule declare
    // it but are not imported anywhere.
    TypeOrmModule.forFeature([Transaction, Rating, ProductVariant, User]),
    UsersModule,
  ],
  providers: [MarketplaceService],
  controllers: [MarketplaceController],
})
export class MarketplaceModule {}