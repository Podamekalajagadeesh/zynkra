
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './mention.entity';
import { MentionsService } from './mentions.service';
import { MentionsController } from './mentions.controller';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { SentimentModule } from '../sentiment/sentiment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mention, User, Post, Comment]), NotificationsModule, SentimentModule],
  controllers: [MentionsController],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionsModule {}