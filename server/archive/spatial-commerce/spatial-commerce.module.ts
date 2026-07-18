import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpatialCommerceService } from './spatial-commerce.service';
import { SpatialCommerceController } from './spatial-commerce.controller';
import { VirtualStorefront } from './entities/virtual-storefront.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualStorefront])],
  controllers: [SpatialCommerceController],
  providers: [SpatialCommerceService],
})
export class SpatialCommerceModule {}
