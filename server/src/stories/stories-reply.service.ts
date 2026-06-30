import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryReply } from './entities/story-reply.entity';
import { StoriesService } from './stories.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StoriesReplyService {
  constructor(
    @InjectRepository(StoryReply)
    private readonly storyRepliesRepository: Repository<StoryReply>,
    private readonly storiesService: StoriesService,
  ) {}

  async addReply(
    userId: string,
    storyId: string,
    text: string,
  ): Promise<StoryReply> {
    const story = await this.storiesService.findOne(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const user = new User();
    user.id = userId;

    const newReply = this.storyRepliesRepository.create({
      story,
      user,
      text,
    });

    return this.storyRepliesRepository.save(newReply);
  }
}