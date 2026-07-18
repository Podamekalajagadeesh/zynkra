import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveshoppingService } from './liveshopping.service';
import { LiveshoppingController } from './liveshopping.controller';
import { LiveshoppingGateway } from './liveshopping.gateway';
import { LiveShoppingEvent } from './entities/live-shopping-event.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../marketplace/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveShoppingEvent, User, Product]),
  ],
  controllers: [LiveshoppingController],
  providers: [LiveshoppingService, LiveshoppingGateway],
  exports: [LiveshoppingService],
})
export class LiveshoppingModule {}