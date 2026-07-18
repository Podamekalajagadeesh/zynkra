import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineReview } from './entities/timeline-review.entity';
import { TimelineReviewService } from './timeline-review.service';
import { TimelineReviewController } from './timeline-review.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineReview]), AuthModule, NotificationsModule],
  controllers: [TimelineReviewController],
  providers: [TimelineReviewService],
  exports: [TimelineReviewService],
})
export class TimelineReviewModule {}