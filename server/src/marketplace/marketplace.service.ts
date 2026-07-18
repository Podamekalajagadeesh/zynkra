
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Rating } from './entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { TransactionStatus } from './transaction.enum';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
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
}