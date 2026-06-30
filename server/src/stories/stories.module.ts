import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story } from './entities/story.entity';
import { StoryElement } from './entities/story-element.entity';
import { UsersModule } from '../users/users.module';
import { StoryHighlight } from './entities/story-highlight.entity';
import { HighlightsService } from './highlights.service';
import { HighlightsController } from './highlights.controller';
import { StoryReaction } from './entities/story-reaction.entity';
import { StoryReply } from './entities/story-reply.entity';
import { StoriesReactionController } from './stories-reaction.controller';
import { StoriesReplyController } from './stories-reply.controller';
import { StoriesReactionService } from './stories-reaction.service';
import { StoriesReplyService } from './stories-reply.service';

@Module({
  imports: [TypeOrmModule.forFeature([Story, StoryElement, StoryHighlight, StoryReaction, StoryReply]), UsersModule],
  controllers: [StoriesController, HighlightsController, StoriesReactionController, StoriesReplyController],
  providers: [StoriesService, HighlightsService, StoriesReactionService, StoriesReplyService],
  exports: [StoriesService],
})
export class StoriesModule {}