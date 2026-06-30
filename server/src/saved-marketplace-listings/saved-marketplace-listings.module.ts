import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedMarketplaceListing } from './entities/saved-marketplace-listing.entity';
import { SavedMarketplaceListingsService } from './saved-marketplace-listings.service';
import { SavedMarketplaceListingsController } from './saved-marketplace-listings.controller';
import { MarketplaceListing } from '../marketplace/entities/listing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedMarketplaceListing, MarketplaceListing]),
  ],
  providers: [SavedMarketplaceListingsService],
  controllers: [SavedMarketplaceListingsController],
})
export class SavedMarketplaceListingsModule {}