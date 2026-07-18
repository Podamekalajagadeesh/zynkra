import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualRealEstateService } from './virtual-real-estate.service';
import { VirtualRealEstateController } from './virtual-real-estate.controller';
import { VirtualProperty } from './entities/virtual-property.entity';
import { PropertyShare } from './entities/property-share.entity';
import { PropertyListing } from './entities/property-listing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualProperty, PropertyShare, PropertyListing])
  ],
  controllers: [VirtualRealEstateController],
  providers: [VirtualRealEstateService],
})
export class VirtualRealEstateModule {}
