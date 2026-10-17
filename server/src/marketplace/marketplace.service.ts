
import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Rating } from './entities/rating.entity';
import { MarketplaceListing } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { TransactionStatus } from './transaction.enum';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(MarketplaceListing)
    private readonly listingRepository: Repository<MarketplaceListing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, seller: User): Promise<Transaction> {
    const buyer = await this.userRepository.findOne({where: {id: createTransactionDto.buyerId}});
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const transaction = this.transactionRepository.create({
      seller,
      buyer,
    });

    return this.transactionRepository.save(transaction);
  }

  async createRating(createRatingDto: CreateRatingDto, rater: User): Promise<Rating> {
    const transaction = await this.transactionRepository.findOne({where: {id: createRatingDto.transactionId}, relations: ['seller', 'buyer']});
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new UnauthorizedException('Transaction is not completed');
    }

    const isBuyer = transaction.buyer.id === rater.id;
    const isSeller = transaction.seller.id === rater.id;

    if (!isBuyer && !isSeller) {
      throw new UnauthorizedException('You are not part of this transaction');
    }

    const ratee = isBuyer ? transaction.seller : transaction.buyer;

    const existingRating = await this.ratingRepository.findOne({where: {transaction: {id: transaction.id}, rater: {id: rater.id}}});
    if (existingRating) {
      throw new UnauthorizedException('You have already rated this transaction');
    }

    const rating = this.ratingRepository.create({
      ...createRatingDto,
      rater,
      ratee,
      transaction,
    });

    const savedRating = await this.ratingRepository.save(rating);

    await this.updateUserRating(ratee);

    return savedRating;
  }

  private async updateUserRating(user: User): Promise<void> {
    const ratings = await this.ratingRepository.find({where: {ratee: {id: user.id}}});
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 ? ratings.reduce((acc, r) => acc + r.score, 0) / totalRatings : 0;

    user.totalRatings = totalRatings;
    user.averageRating = averageRating;

    await this.userRepository.save(user);
  }

  async findAllListings(query?: string): Promise<MarketplaceListing[]> {
    const qb = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .orderBy('listing.createdAt', 'DESC')
      .take(100);

    if (query?.trim()) {
      const term = `%${query.trim()}%`;
      qb.where('listing.title ILIKE :term', { term }).orWhere('listing.description ILIKE :term', { term });
    }

    return qb.getMany();
  }

  async findOneListing(id: string): Promise<MarketplaceListing> {
    const listing = await this.listingRepository.findOne({
      where: {id},
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async createListing(createListingDto: CreateListingDto, sellerId: string): Promise<MarketplaceListing> {
    const seller = await this.userRepository.findOne({where: {id: sellerId}});
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const listing = this.listingRepository.create({
      title: createListingDto.title.trim(),
      description: createListingDto.description ?? '',
      price: createListingDto.price,
      location: createListingDto.location ?? '',
      imageUrls: createListingDto.imageUrls ?? [],
      seller,
    });

    return this.listingRepository.save(listing);
  }

  async updateListing(id: string, updateListingDto: UpdateListingDto, userId: string): Promise<MarketplaceListing> {
    const listing = await this.assertListingOwnership(id, userId);

    if (updateListingDto.title !== undefined) {
      listing.title = updateListingDto.title.trim();
    }
    if (updateListingDto.description !== undefined) {
      listing.description = updateListingDto.description;
    }
    if (updateListingDto.price !== undefined) {
      listing.price = updateListingDto.price;
    }
    if (updateListingDto.location !== undefined) {
      listing.location = updateListingDto.location;
    }
    if (updateListingDto.imageUrls !== undefined) {
      listing.imageUrls = updateListingDto.imageUrls;
    }

    return this.listingRepository.save(listing);
  }

  async removeListing(id: string, userId: string): Promise<void> {
    const listing = await this.assertListingOwnership(id, userId);
    await this.listingRepository.remove(listing);
  }

  private async assertListingOwnership(id: string, userId: string): Promise<MarketplaceListing> {
    const listing = await this.listingRepository.findOne({
      where: {id},
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.seller?.id !== userId) {
      throw new ForbiddenException('You can only modify your own listings');
    }

    return listing;
  }
}