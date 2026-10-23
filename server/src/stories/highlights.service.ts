import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryHighlight } from './entities/story-highlight.entity';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { StoriesService } from './stories.service';
import { UsersService } from '../users/users.service';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(StoryHighlight)
    private highlightsRepository: Repository<StoryHighlight>,
    private readonly storiesService: StoriesService,
    private readonly usersService: UsersService
  ) {}

  async create(createHighlightDto: CreateHighlightDto, userId: string): Promise<StoryHighlight> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storyIds = [...new Set(createHighlightDto.storyIds)];
    const stories = await this.storiesService.findMultipleByIds(storyIds, userId);
    if (stories.length !== storyIds.length) {
      throw new NotFoundException('One or more stories not found or do not belong to the user.');
    }

    const highlight = this.highlightsRepository.create({
      title: createHighlightDto.title,
      coverUrl: createHighlightDto.coverUrl,
      user,
      stories,
    });

    const saved = await this.highlightsRepository.save(highlight);
    // Re-fetch so the response carries the eager-loaded User entity (with its
    // @Exclude metadata applied) instead of the raw JWT principal object.
    return this.findOne(saved.id);
  }

  async findAll(userId: string): Promise<StoryHighlight[]> {
    return this.highlightsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Highlights of `identifier` (id or username) as seen by `viewerId`, ordered
   * newest-first. Owners always see their own; everyone else only sees
   * highlights that still contain at least one story they are allowed to view
   * (same rules as StoriesService.canViewStory). Blocks hide the list entirely.
   */
  async findForUser(identifier: string, viewerId: string): Promise<StoryHighlight[]> {
    // Username first: an OR-style id/username query makes Postgres cast the
    // identifier to uuid and explode on plain usernames (invalid input syntax).
    const target =
      (await this.usersService.findByUsername(identifier)) ??
      (UUID_PATTERN.test(identifier) ? await this.usersService.findOneById(identifier) : undefined);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.id === viewerId) {
      return this.findAll(viewerId);
    }

    if (
      (await this.usersService.isBlockedBy(viewerId, target.id)) ||
      (await this.usersService.isBlockedBy(target.id, viewerId))
    ) {
      return [];
    }

    const viewer = await this.usersService.findOneById(viewerId, [
      'following',
      'followers',
      'closeFriendsWith',
    ]);
    if (!viewer) {
      return [];
    }

    const highlights = await this.highlightsRepository.find({
      where: { user: { id: target.id } },
      order: { createdAt: 'DESC' },
    });

    const visible: StoryHighlight[] = [];
    for (const highlight of highlights) {
      const stories = [];
      for (const story of highlight.stories) {
        if (await this.storiesService.canViewStory(story, viewer)) {
          stories.push(story);
        }
      }
      if (stories.length > 0) {
        highlight.stories = stories;
        visible.push(highlight);
      }
    }
    return visible;
  }

  async findOne(id: string, viewerId?: string): Promise<StoryHighlight> {
    const highlight = await this.highlightsRepository.findOne({ where: { id } });
    if (!highlight) {
      throw new NotFoundException(`Highlight with ID "${id}" not found`);
    }
    if (viewerId !== undefined && highlight.user.id !== viewerId) {
      throw new UnauthorizedException();
    }
    return highlight;
  }

  async update(
    id: string,
    updateHighlightDto: UpdateHighlightDto,
    userId: string
  ): Promise<StoryHighlight> {
    const highlight = await this.findOne(id);
    if (highlight.user.id !== userId) {
      throw new UnauthorizedException();
    }

    const { storyIds, ...rest } = updateHighlightDto;
    if (storyIds) {
      const uniqueIds = [...new Set(storyIds)];
      const stories = await this.storiesService.findMultipleByIds(uniqueIds, userId);
      if (stories.length !== uniqueIds.length) {
        throw new NotFoundException('One or more stories not found or do not belong to the user.');
      }
      highlight.stories = stories;
    }

    Object.assign(highlight, rest);
    return this.highlightsRepository.save(highlight);
  }

  async remove(id: string, userId: string): Promise<void> {
    const highlight = await this.findOne(id);
    if (highlight.user.id !== userId) {
      throw new UnauthorizedException();
    }
    await this.highlightsRepository.remove(highlight);
  }
}
