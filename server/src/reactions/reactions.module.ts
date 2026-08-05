import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { PostsModule } from '../posts/posts.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostReaction]), PostsModule, WebhooksModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}