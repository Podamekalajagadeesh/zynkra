import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryReply } from './entities/story-reply.entity';
import { Story } from './entities/story.entity';
import { StoriesService } from './stories.service';
import { User } from '../users/entities/user.entity';

export interface RepliesPage {
  data: StoryReply[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class StoriesReplyService {
  constructor(
    @InjectRepository(StoryReply)
    private readonly storyRepliesRepository: Repository<StoryReply>,
    @InjectRepository(Story)
    private readonly storiesRepository: Repository<Story>,
    private readonly storiesService: StoriesService
  ) {}

  async addReply(userId: string, storyId: string, text: string): Promise<StoryReply> {
    const story = await this.storiesService.findOne(storyId, userId);
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

  /**
   * Owner-only inbox for one story. Mirrors StoriesService.getViews: the story
   * row is loaded un-gated so strangers get 404/401 instead of leaking the
   * same visibility logic a viewer would hit.
   */
  async getReplies(
    storyId: string,
    requesterId: string,
    page = 1,
    limit = 20
  ): Promise<RepliesPage> {
    const story = await this.storiesRepository.findOne({
      where: { id: storyId },
      relations: ['user'],
    });
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.user.id !== requesterId) {
      throw new UnauthorizedException("You are not authorized to view this story's replies");
    }

    const [data, total] = await this.storyRepliesRepository.findAndCount({
      where: { story: { id: storyId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Hard delete; either the reply's author or the story owner may remove it
   * (standard social-platform moderation). Scoped to the story in the route so
   * a replyId from another story can never be reached through this path.
   */
  async deleteReply(storyId: string, replyId: string, requesterId: string): Promise<void> {
    const reply = await this.storyRepliesRepository.findOne({
      where: { id: replyId, story: { id: storyId } },
      relations: ['user', 'story', 'story.user'],
    });
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.user.id !== requesterId && reply.story.user.id !== requesterId) {
      throw new UnauthorizedException('You are not authorized to delete this reply');
    }

    await this.storyRepliesRepository.delete(reply.id);
  }
}
