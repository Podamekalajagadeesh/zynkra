
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
import { ShippingInventoryService } from './shipping-inventory.service';
import { ShippingInventoryController } from './shipping-inventory.controller';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';
import { Shipment } from './entities/shipment.entity';
import { ReturnRequest } from './entities/return-request.entity';
import { Supplier } from './entities/supplier.entity';
import { DemandForecast } from './entities/demand-forecast.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction, Rating, ProductVariant, User,
      ProductReview, EscrowTransaction, CheckoutSession, Product,
      Warehouse, InventoryStock, InventoryReservation, Shipment, ReturnRequest, Supplier, DemandForecast, Order,
    ]),
    UsersModule,
    WalletModule,
  ],
  providers: [MarketplaceService, CommerceService, ShippingInventoryService],
  controllers: [MarketplaceController, CommerceController, ShippingInventoryController],
})
export class MarketplaceModule {}