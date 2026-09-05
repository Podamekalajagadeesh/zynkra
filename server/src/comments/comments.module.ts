import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { ReputationModule } from '../reputation/reputation.module';
import { MentionsModule } from '../mentions/mentions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SentimentModule } from '../sentiment/sentiment.module';
import { UserInterestsModule } from '../user-interests/user-interests.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ProfileReviewModule } from '../tags/profile-review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    PostsModule,
    UsersModule,
    UserInterestsModule,
    ReputationModule,
    NotificationsModule,
    MentionsModule,
    SentimentModule,
    WebhooksModule,
    ProfileReviewModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}