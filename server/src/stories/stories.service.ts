import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import { Story, StoryAudience } from './entities/story.entity';
import { User } from '../users/entities/user.entity';
import { Cron } from '@nestjs/schedule';
import { StoryElement, StoryElementType } from './entities/story-element.entity';
import { UsersService } from '../users/users.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { StoryView } from './entities/story-view.entity';
import { CustomAudience } from '../custom-audiences/entities/custom-audience.entity';

import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private storiesRepository: Repository<Story>,
    @InjectRepository(StoryView)
    private storyViewsRepository: Repository<StoryView>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(CustomAudience)
    private customAudiencesRepository: Repository<CustomAudience>,
    private readonly usersService: UsersService,
  ) {}

  @Cron('0 * * * *', { name: 'stories-expiration-cleanup' })
  async handleCron() {
    const now = new Date();
    const expiredStories = await this.storiesRepository.find({
      where: { expiresAt: LessThan(now) },
    });

    if (expiredStories.length > 0) {
      const idsToDelete = expiredStories.map((story) => story.id);
      await this.storiesRepository.delete(idsToDelete);
    }
  }

  async create(
    createStoryDto: CreateStoryDto,
    userId: string,
  ): Promise<Story> {
    if (!createStoryDto.mediaUrl && !createStoryDto.textContent) {
      throw new BadRequestException('Story must have either media or text content.');
    }

    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Check if user is trying to boost a story and verify they have an active subscription
    if (createStoryDto.isBoosted) {
      const activeSubscription = await this.subscriptionsRepository.findOne({
        where: {
          subscriber: { id: userId },
          status: SubscriptionStatus.ACTIVE,
          expiresAt: MoreThan(new Date())
        }
      });

      if (!activeSubscription) {
        throw new ForbiddenException('You need an active premium subscription to boost stories.');
      }
    }

    let audience = createStoryDto.audience || StoryAudience.PUBLIC;
    let customAudienceId = createStoryDto.customAudienceId ?? null;
    if (typeof audience === 'string' && audience.startsWith('custom_')) {
      customAudienceId = audience.slice('custom_'.length);
      audience = StoryAudience.CUSTOM;
    }
    if (audience === StoryAudience.CUSTOM) {
      if (!customAudienceId) {
        throw new BadRequestException('A custom audience is required.');
      }
      const customAudience = await this.customAudiencesRepository.findOne({
        where: { id: customAudienceId, userId },
      });
      if (!customAudience) {
        throw new ForbiddenException('You do not own this custom audience.');
      }
    } else {
      customAudienceId = null;
    }

    const story = this.storiesRepository.create({
      ...createStoryDto,
      user,
      expiresAt,
      audience,
      customAudienceId,
      excludedUserIds: createStoryDto.excludedUserIds ?? [],
      isBoosted: createStoryDto.isBoosted || false,
    });

    if (createStoryDto.elements && createStoryDto.elements.length > 0) {
      story.elements = createStoryDto.elements.map((element) =>
        Object.assign(new StoryElement(), {
          ...element,
          story,
        }),
      );
    }

    const savedStory = await this.storiesRepository.save(story);

    if (createStoryDto.elements && createStoryDto.elements.length > 0) {
      savedStory.elements = story.elements;
    }

    return savedStory;
  }

  async findOne(storyId: string, viewerId?: string): Promise<Story | null> {
    const story = await this.storiesRepository.findOne({
      where: { id: storyId },
      relations: ['user', 'elements']
    });

    if (!story || viewerId === undefined || story.user.id === viewerId) {
      return story;
    }

    const viewer = await this.usersService.findOneById(viewerId, ['following', 'followers', 'closeFriendsWith']);
    if (!viewer || !(await this.canViewStory(story, viewer))) {
      return null;
    }

    return story;
  }

  private async canViewStory(story: Story, viewer: Pick<User, 'id' | 'following' | 'followers' | 'closeFriendsWith'>): Promise<boolean> {
    if (story.user.id === viewer.id) return true;
    if (story.excludedUserIds?.includes(viewer.id)) return false;
    if (story.audience === StoryAudience.CLOSE_FRIENDS) {
      return viewer.closeFriendsWith.some((user) => user.id === story.user.id);
    }
    if (story.audience === StoryAudience.CUSTOM) {
      if (!story.customAudienceId) return false;
      const customAudience = await this.customAudiencesRepository.findOne({ where: { id: story.customAudienceId } });
      return customAudience?.userId === story.user.id && customAudience.userIds.includes(viewer.id);
    }

    switch (story.user.storyVisibility) {
      case 'only_me':
        return false;
      case 'friends':
        return viewer.following.some((user) => user.id === story.user.id)
          && viewer.followers.some((user) => user.id === story.user.id);
      case 'followers':
        return viewer.following.some((user) => user.id === story.user.id);
      case 'public':
      default:
        return true;
    }
  }

  async findActiveStoriesForUser(userId: string): Promise<Story[]> {
    const now = new Date();
    const user = await this.usersService.findOneById(userId, ['following', 'followers', 'closeFriendsWith']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followingIds = user.following.map((followedUser) => followedUser.id);
    const closeFriendsWithIds = user.closeFriendsWith.map((closeFriendUser) => closeFriendUser.id);
    const followerIds = user.followers.map((follower) => follower.id);

    const stories = await this.storiesRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.elements', 'elements')
      .where('story.expiresAt > :now', { now })
      .andWhere(
        '(story.userId = :viewerId) OR ' +
          '(story.audience = :publicAudience) OR ' +
          '(story.audience = :closeFriendsAudience AND story.userId IN (:...closeFriendsWithIds)) OR ' +
          '(story.audience = :customAudience)',
        {
          viewerId: userId,
          publicAudience: StoryAudience.PUBLIC,
          closeFriendsAudience: StoryAudience.CLOSE_FRIENDS,
          customAudience: StoryAudience.CUSTOM,
          closeFriendsWithIds: closeFriendsWithIds.length > 0 ? closeFriendsWithIds : [null],
        },
      )
      .orderBy('story.isBoosted', 'DESC')
      .addOrderBy('story.createdAt', 'DESC')
      .getMany();

    const visibleStories: Story[] = [];
    for (const story of stories) {
      if (await this.canViewStory(story, {
      id: userId,
      following: user.following,
      followers: user.followers,
      closeFriendsWith: user.closeFriendsWith,
      })) {
        visibleStories.push(story);
      }
    }
    return visibleStories;
  }

  async findActiveStories(followingIds?: string[]): Promise<Story[]> {
    const now = new Date();
    const where: any = { expiresAt: MoreThan(now) };

    if (followingIds) {
      where.user = { id: In(followingIds) };
    }

    return this.storiesRepository.find({
      where,
      relations: ['user', 'elements'],
      order: {
        isBoosted: 'DESC',
        createdAt: 'DESC'
      }
    });
  }

  async findMultipleByIds(storyIds: string[], userId: string): Promise<Story[]> {
    const stories = await this.storiesRepository.find({
      where: {
        id: In(storyIds),
        user: { id: userId },
      },
    });
    return stories;
  }

  async trackView(storyId: string, userId: string, isAnonymous: boolean = false): Promise<StoryView> {
    const story = await this.findOne(storyId, userId);
    if (!story) {
      throw new ForbiddenException('You are not authorized to view this story');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already viewed this story to track rewatches
    const existingView = await this.storyViewsRepository.findOne({
      where: { story: { id: storyId }, user: { id: userId } }
    });

    if (existingView) {
      // Update anonymous status if it changed and increment rewatch count
      existingView.isAnonymous = isAnonymous;
      existingView.rewatchCount += 1;
      existingView.viewTimestamps.push(new Date());
      return this.storyViewsRepository.save(existingView);
    }

    // Create new view
    const storyView = this.storyViewsRepository.create({
      story,
      user,
      isAnonymous,
      viewTimestamps: [new Date()],
      rewatchCount: 1
    });

    return this.storyViewsRepository.save(storyView);
  }

  async getViews(storyId: string, userId: string): Promise<StoryView[]> {
    const story = await this.storiesRepository.findOne({ where: { id: storyId }, relations: ['user'] });
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Only the story owner can view the viewer list
    if (story.user.id !== userId) {
      throw new UnauthorizedException('You are not authorized to view this story\'s viewers');
    }

    return this.storyViewsRepository.find({
      where: { story: { id: storyId } },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async delete(storyId: string, userId: string): Promise<void> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const story = await this.storiesRepository.findOne({ where: { id: storyId }, relations: ['user'] });

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.user.id !== user.id) {
      throw new UnauthorizedException('You are not the owner of this story');
    }

    await this.storyViewsRepository.delete({ story: { id: storyId } });
    await this.storiesRepository.delete(storyId);
  }
}