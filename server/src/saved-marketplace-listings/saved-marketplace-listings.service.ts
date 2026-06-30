import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedMarketplaceListing } from './entities/saved-marketplace-listing.entity';
import { CreateSavedMarketplaceListingDto } from './dto/create-saved-marketplace-listing.dto';
import { User } from '../users/entities/user.entity';
import { MarketplaceListing } from '../marketplace/entities/listing.entity';

@Injectable()
export class SavedMarketplaceListingsService {
  constructor(
    @InjectRepository(SavedMarketplaceListing)
    private savedMarketplaceListingsRepository: Repository<SavedMarketplaceListing>,
    @InjectRepository(MarketplaceListing)
    private marketplaceListingsRepository: Repository<MarketplaceListing>,
  ) {}

  async create(
    createSavedMarketplaceListingDto: CreateSavedMarketplaceListingDto,
    user: User,
  ) {
    const listing = await this.marketplaceListingsRepository.findOne({
      where: { id: createSavedMarketplaceListingDto.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Marketplace listing not found');
    }
    const savedListing = this.savedMarketplaceListingsRepository.create({
      user,
      listing,
    });
    return this.savedMarketplaceListingsRepository.save(savedListing);
  }

  async findAll(user: User) {
    return this.savedMarketplaceListingsRepository.find({
      where: { user: { id: user.id } },
      relations: ['listing'],
    });
  }

  async remove(listingId: string, user: User) {
    const result = await this.savedMarketplaceListingsRepository.delete({
      listing: { id: listingId },
      user: { id: user.id },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Saved marketplace listing not found');
    }
  }
}