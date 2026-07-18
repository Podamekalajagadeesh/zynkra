import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualProperty } from './entities/virtual-property.entity';
import { PropertyShare } from './entities/property-share.entity';
import { PropertyListing } from './entities/property-listing.entity';

@Injectable()
export class VirtualRealEstateService {
  constructor(
    @InjectRepository(VirtualProperty)
    private readonly propertyRepository: Repository<VirtualProperty>,
    @InjectRepository(PropertyShare)
    private readonly shareRepository: Repository<PropertyShare>,
    @InjectRepository(PropertyListing)
    private readonly listingRepository: Repository<PropertyListing>,
  ) {}

  async getUserProperties(userId: string) {
    const shares = await this.shareRepository.find({
      where: { userId },
      relations: ['property', 'property.shares', 'property.shares.user'],
    });

    return shares.map(share => {
      const property = share.property;
      return {
        id: property.id,
        worldId: property.worldId,
        worldName: property.worldName,
        parcelId: property.parcelId,
        coordinates: property.coordinates,
        size: property.size,
        totalValue: property.totalValue,
        currentValue: property.currentValue,
        revenueShare: property.revenueShare,
        monthlyRevenue: property.monthlyRevenue,
        imageUrl: property.imageUrl,
        isDeveloped: property.isDeveloped,
        developmentType: property.developmentType,
        blockchainNetwork: property.blockchainNetwork,
        tokenContractAddress: property.tokenContractAddress,
        owners: property.shares.map(s => ({
          userId: s.userId,
          username: s.user?.username || 'Unknown',
          avatarUrl: s.user?.avatar || 'https://example.com/default-avatar.png',
          ownershipPercentage: s.ownershipPercentage,
          walletAddress: s.user?.walletAddress || '0x000',
          joinDate: s.createdAt,
          totalEarned: s.totalEarned,
        })),
      };
    });
  }

  async getActiveListings() {
    const listings = await this.listingRepository.find({
      where: { status: 'active' },
      relations: ['property'],
    });

    return listings.map(listing => ({
      id: listing.id,
      parcelId: listing.property.parcelId,
      worldName: listing.property.worldName,
      sharesAvailable: listing.sharesAvailable,
      sharePrice: listing.sharePrice,
      minInvestment: listing.minInvestment,
      totalShares: listing.totalShares,
      currentSharesSold: listing.currentSharesSold,
      projectedAnnualReturn: listing.projectedAnnualReturn,
      description: listing.description,
      imageUrl: listing.property.imageUrl,
      endDate: listing.endDate,
    }));
  }

  async invest(userId: string, listingId: string, amount: number) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['property'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (amount < listing.minInvestment) {
      throw new BadRequestException(`Minimum investment is $${listing.minInvestment}`);
    }

    const sharesToBuy = amount / listing.sharePrice;
    if (sharesToBuy > listing.sharesAvailable) {
      throw new BadRequestException('Not enough shares available');
    }

    // Process investment
    listing.sharesAvailable -= sharesToBuy;
    listing.currentSharesSold += sharesToBuy;

    if (listing.sharesAvailable <= 0) {
      listing.status = 'completed';
    }

    await this.listingRepository.save(listing);

    // Calculate ownership percentage based on total shares
    const ownershipPercentage = (sharesToBuy / listing.totalShares) * 100;

    // Check if user already owns shares in this property
    let userShare = await this.shareRepository.findOne({
      where: { propertyId: listing.propertyId, userId },
    });

    if (userShare) {
      userShare.ownershipPercentage += ownershipPercentage;
      await this.shareRepository.save(userShare);
    } else {
      userShare = this.shareRepository.create({
        propertyId: listing.propertyId,
        userId,
        ownershipPercentage,
        totalEarned: 0,
      });
      await this.shareRepository.save(userShare);
    }

    return { success: true, message: 'Investment successful', shares: sharesToBuy, ownershipPercentage };
  }
}
