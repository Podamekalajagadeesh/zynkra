import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

import { Comment } from '../comments/entities/comment.entity';
import { Report } from '../reports/entities/report.entity';
import { StorageModule } from '../storage/storage.module';
import { TokenGatedContentModule } from '../token-gated-content/token-gated-content.module';
import { ReputationModule } from '../reputation/reputation.module';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrendsModule } from '../trends/trends.module';
import { MentionsModule } from '../mentions/mentions.module';
import { TagsModule } from '../tags/tags.module';
import { WalletModule } from '../wallet/wallet.module';
import { UserInterestsModule } from '../user-interests/user-interests.module';
import { Poll } from '../polls/entities/poll.entity';
import { PollOption } from '../polls/entities/poll-option.entity';
import { ReelEffect } from '../reels/entities/reel-effect.entity';
import { GroupsModule } from '../groups/groups.module';
import { TimelineReviewModule } from '../timeline-review/timeline-review.module';
import { MediaModule } from '../media/media.module';
import { ProfileReviewModule } from '../tags/profile-review.module';
import { Media } from '../media/entities/media.entity';
import { TimelineReview } from '../timeline-review/entities/timeline-review.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostReaction, Comment, Report, Poll, PollOption, Media, ReelEffect, TimelineReview, Subscription]),
    UsersModule,
    StorageModule,
    TokenGatedContentModule,
    ReputationModule,
    HttpModule,
    NotificationsModule,
    WalletModule,
    TrendsModule,
    MentionsModule,
    TagsModule,
    UserInterestsModule,
    GroupsModule,
    TimelineReviewModule,
    MediaModule,
    ProfileReviewModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}