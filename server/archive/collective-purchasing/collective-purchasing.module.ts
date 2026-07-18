import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectivePurchasingService } from './collective-purchasing.service';
import { CollectivePurchasingController } from './collective-purchasing.controller';
import { CollectivePurchase, CollectivePurchaseParticipant } from './entities/collective-purchase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollectivePurchase, CollectivePurchaseParticipant])],
  controllers: [CollectivePurchasingController],
  providers: [CollectivePurchasingService],
})
export class CollectivePurchasingModule {}
