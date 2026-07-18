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

    const story = this.storiesRepository.create({
      ...createStoryDto,
      user,
      expiresAt,
      audience: createStoryDto.audience || StoryAudience.PUBLIC,
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

  async findOne(storyId: string): Promise<Story | null> {
    return this.storiesRepository.findOne({
      where: { id: storyId },
      relations: ['user', 'elements']
    });
  }

  async findActiveStoriesForUser(userId: string): Promise<Story[]> {
    const now = new Date();
    const user = await this.usersService.findOneById(userId, ['following', 'closeFriendsWith']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followingIds = user.following.map((followedUser) => followedUser.id);
    const closeFriendsWithIds = user.closeFriendsWith.map((closeFriendUser) => closeFriendUser.id);

    const stories = await this.storiesRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.elements', 'elements')
      .where('story.expiresAt > :now', { now })
      .andWhere(
        '(story.audience = :publicAudience AND story.userId IN (:...followingIds)) OR ' +
          '(story.audience = :closeFriendsAudience AND story.userId IN (:...closeFriendsWithIds))',
        {
          publicAudience: StoryAudience.PUBLIC,
          followingIds: followingIds.length > 0 ? followingIds : [null],
          closeFriendsAudience: StoryAudience.CLOSE_FRIENDS,
          closeFriendsWithIds: closeFriendsWithIds.length > 0 ? closeFriendsWithIds : [null],
        },
      )
      .orderBy('story.isBoosted', 'DESC')
      .addOrderBy('story.createdAt', 'DESC')
      .getMany();

    return stories;
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
    const story = await this.storiesRepository.findOne({ where: { id: storyId }, relations: ['user'] });
    if (!story) {
      throw new NotFoundException('Story not found');
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