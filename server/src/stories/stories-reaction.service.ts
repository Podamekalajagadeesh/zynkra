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
    private readonly storiesService: StoriesService,
  ) {}

  async addReaction(
    userId: string,
    storyId: string,
    reaction: string,
  ): Promise<StoryReaction> {
    const story = await this.storiesService.findOne(storyId, userId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const user = new User();
    user.id = userId;

    const newReaction = this.storyReactionsRepository.create({
      story,
      user,
      reaction,
    });

    return this.storyReactionsRepository.save(newReaction);
  }
}