import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileReviewController } from './profile-review.controller';
import { ProfileReviewService } from './profile-review.service';
import { TagReview } from './entities/tag-review.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TagReview, Post])],
  controllers: [ProfileReviewController],
  providers: [ProfileReviewService],
  exports: [ProfileReviewService],
})
export class ProfileReviewModule {}