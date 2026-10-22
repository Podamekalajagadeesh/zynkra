import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { PostsModule } from '../posts/posts.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostReaction]),
    PostsModule,
    WebhooksModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
