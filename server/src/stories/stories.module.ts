import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story } from './entities/story.entity';
import { StoryElement } from './entities/story-element.entity';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { StoryHighlight } from './entities/story-highlight.entity';
import { HighlightsService } from './highlights.service';
import { HighlightsController } from './highlights.controller';
import { StoryReaction } from './entities/story-reaction.entity';
import { StoryReply } from './entities/story-reply.entity';
import { StoriesReactionController } from './stories-reaction.controller';
import { StoriesReplyController } from './stories-reply.controller';
import { StoriesReactionService } from './stories-reaction.service';
import { StoriesReplyService } from './stories-reply.service';
import { StoryView } from './entities/story-view.entity';
import { StoryPollVote } from './entities/story-poll-vote.entity';
import { StoriesPollController } from './stories-poll.controller';
import { StoriesPollService } from './stories-poll.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { CustomAudience } from '../custom-audiences/entities/custom-audience.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Story,
      StoryElement,
      StoryHighlight,
      StoryReaction,
      StoryReply,
      StoryView,
      StoryPollVote,
      Subscription,
      CustomAudience,
    ]),
    UsersModule,
    MediaModule,
  ],
  controllers: [
    StoriesController,
    HighlightsController,
    StoriesReactionController,
    StoriesReplyController,
    StoriesPollController,
  ],
  providers: [
    StoriesService,
    HighlightsService,
    StoriesReactionService,
    StoriesReplyService,
    StoriesPollService,
  ],
  exports: [StoriesService],
})
export class StoriesModule {}
