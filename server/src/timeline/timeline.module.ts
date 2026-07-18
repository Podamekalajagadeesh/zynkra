import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineReview } from './timeline-review.entity';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineReview, Post, User]), NotificationsModule],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}