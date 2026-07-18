import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeuralProductReview } from './entities/neural-product-review.entity';

@Injectable()
export class NeuralProductReviewsService {
  constructor(
    @InjectRepository(NeuralProductReview)
    private readonly reviewRepository: Repository<NeuralProductReview>,
  ) {}

  async createReview(userId: string, data: Partial<NeuralProductReview>) {
    const review = this.reviewRepository.create({
      ...data,
      userId,
    });
    return this.reviewRepository.save(review);
  }

  async getReviewsForProduct(productId: string) {
    return this.reviewRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviewById(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async getUserReviews(userId: string) {
    return this.reviewRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
