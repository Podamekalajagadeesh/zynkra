import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileReviewController } from './profile-review.controller';
import { ProfileReviewService } from './profile-review.service';
import { TagReview } from './entities/tag-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TagReview])],
  controllers: [ProfileReviewController],
  providers: [ProfileReviewService],
  exports: [ProfileReviewService],
})
export class ProfileReviewModule {}