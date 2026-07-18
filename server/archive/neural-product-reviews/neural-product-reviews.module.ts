import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralProductReviewsService } from './neural-product-reviews.service';
import { NeuralProductReviewsController } from './neural-product-reviews.controller';
import { NeuralProductReview } from './entities/neural-product-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NeuralProductReview])],
  controllers: [NeuralProductReviewsController],
  providers: [NeuralProductReviewsService],
})
export class NeuralProductReviewsModule {}
