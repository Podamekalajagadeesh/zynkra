import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryReaction } from './entities/story-reaction.entity';
import { StoriesService } from './stories.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StoriesReactionService {
  constructor(
    @InjectRepository(StoryReaction)
    private readonly storyReactionsRepository: Repository<StoryReaction>,
    private readonly storiesService: StoriesService
  ) {}

  async addReaction(userId: string, storyId: string, reaction: string): Promise<StoryReaction> {
    const story = await this.storiesService.findOne(storyId, userId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const user = new User();
    user.id = userId;

    // One active reaction per (story, user): re-tapping replaces it instead of
    // inserting a duplicate row (backstopped by the unique index on both FKs).
    const existing = await this.storyReactionsRepository.findOne({
      where: { story: { id: storyId }, user: { id: userId } },
    });
    if (existing) {
      existing.reaction = reaction;
      return this.storyReactionsRepository.save(existing);
    }

    const newReaction = this.storyReactionsRepository.create({
      story,
      user,
      reaction,
    });

    return this.storyReactionsRepository.save(newReaction);
  }
}
