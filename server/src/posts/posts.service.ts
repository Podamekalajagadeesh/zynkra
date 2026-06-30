import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post, PostType, PostVisibility } from './entities/post.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { UsersService } from '../users/users.service';
import { Report } from '../reports/entities/report.entity';
import { Comment } from '../comments/entities/comment.entity';
import { WalletService } from '../wallet/wallet.service';
import { TokenGatedContentService } from '../token-gated-content/token-gated-content.service';
import { StorageService } from '../storage/storage.service';
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEvent } from '../reputation/reputation.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { MentionsService } from '../mentions/mentions.service';
import { TrendsService } from '../trends/trends.service';
import { TagsService } from '../tags/tags.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { Poll } from '../polls/entities/poll.entity';
import { PollOption } from '../polls/entities/poll-option.entity';
import { Media } from '../media/entities/media.entity';
import { GroupsService } from '../groups/groups.service';
import { TimelineReview, ReviewStatus } from '../timeline-review/entities/timeline-review.entity';
import { TimelineReviewService } from '../timeline-review/timeline-review.service';
import { ProfileReviewService } from '../tags/profile-review.service';


import { ReelEffect } from '../reels/entities/reel-effect.entity';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactionsRepository: Repository<PostReaction>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(Poll)
    private readonly pollsRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionsRepository: Repository<PollOption>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(ReelEffect)
    private readonly reelEffectRepository: Repository<ReelEffect>,
    @InjectRepository(TimelineReview)
    private readonly timelineReviewRepository: Repository<TimelineReview>,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly walletService: WalletService,
    private readonly tokenGatedContentService: TokenGatedContentService,
    private readonly reputationService: ReputationService,
    private readonly httpService: HttpService,
    private readonly notificationsService: NotificationsService,
    private readonly trendsService: TrendsService,
    private readonly mentionsService: MentionsService,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    private readonly tagsService: TagsService,
    private readonly userInterestsService: UserInterestsService,
    private readonly groupsService: GroupsService,
    private readonly timelineReviewService: TimelineReviewService,
    private readonly profileReviewService: ProfileReviewService
  ) {}

  async create(
    userPayload: { userId: string },
    createPostDto: any,
    reelEffectId?: string,
    groupId?: string,
  ): Promise<Post> {
    const user = await this.usersService.findOneById(userPayload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Commented out since we removed profileService injection
    // const profile = await this.profileService.findOne(createPostDto.profileId);
    // if (!profile) {
    //   throw new NotFoundException(`Profile with ID ${createPostDto.profileId} not found`);
    // }

    const tags = await this.tagsService.parseAndCreateTags(createPostDto.content);

    const post = new Post();
    // Handle E2EE encrypted content
    if (createPostDto.isEncrypted && createPostDto.encryptedContent) {
      post.encryptedContent = createPostDto.encryptedContent;
      post.isEncrypted = true;
      post.content = '[Encrypted Content]'; // Placeholder for unencrypted view
    } else {
      post.content = createPostDto.content;
      post.isEncrypted = false;
    }
    post.user = user;
    post.tags = tags;
    post.visibility = createPostDto.visibility;
    post.tokenGated = createPostDto.tokenGated;
    post.contractAddress = createPostDto.contractAddress;
    post.requiredTokenBalance = createPostDto.requiredTokenBalance;
    post.filter = createPostDto.filter;
    post.showLikes = createPostDto.showLikes;
    post.locationName = createPostDto.locationName;
    post.latitude = createPostDto.latitude;
    post.longitude = createPostDto.longitude;
    post.activity = createPostDto.activity;
    post.stickers = createPostDto.stickers;
    post.postType = createPostDto.postType;
    post.productTags = createPostDto.productTags;
    post.eventTags = createPostDto.eventTags;
    post.musicTags = createPostDto.musicTags;
    post.autoTags = createPostDto.autoTags;
    post.isSensitive = createPostDto.isSensitive;
    post.enableScreenshotProtection = createPostDto.enableScreenshotProtection;
    // post.profileId = createPostDto.profileId; // Assign profileId - property doesn't exist on Post entity

    if (createPostDto.isAnonymous) {
      if (!groupId) {
        throw new Error('Group ID is required for anonymous posts.');
      }
      const group = await this.groupsService.getGroupById(groupId);
      if (!group || !group.allowAnonymousPosting) {
        throw new Error('This group does not allow anonymous posting.');
      }
      post.isAnonymous = true;
    }

    if (reelEffectId) {
      const reelEffect = await this.reelEffectRepository.findOne({ where: { id: reelEffectId } });
      if (reelEffect) {
        post.reelEffect = reelEffect;
      }
    }

    if (createPostDto.media) {
      post.media = createPostDto.media.map(mediaDto => {
        const media = new Media();
        media.url = mediaDto.url;
        media.type = mediaDto.type;
        media.altText = mediaDto.altText;
        return media;
      });


    }

    if (createPostDto.poll) {
      const poll = new Poll();
      poll.question = createPostDto.poll.question;
      poll.options = createPostDto.poll.options.map(optionDto => {
        const option = new PollOption();
        option.text = optionDto.text;
        return option;
      });
      poll.post = post;
      post.poll = [poll];
    }

    const savedPost = await this.postsRepository.save(post);

    const mentionedUsers = await this.mentionsService.createMentions(
      savedPost.content,
      savedPost,
      null,
      user,
    );

    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.tagReviewEnabled) {
        await this.profileReviewService.createForPost(savedPost, mentionedUser, user);
      }
    }

    await this.reputationService.addReputation(ReputationEvent.POST_CREATED, user);
    await this.trendsService.extractAndScoreHashtags(savedPost.content);

    return savedPost as Post;
  }

  async findOne(id: string, userId?: string): Promise<Post | undefined> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: [
        'user', 
        'user.followers', 
        'likes', 
        'likes.user', 
        'comments', 
        'comments.user', 
        'comments.awards',
        'comments.awards.gift',
        'comments.awards.sender',
        'awards', 
        'awards.gift', 
        'awards.sender',
        'tags'
      ],
    });

    if (!post) {
      return undefined;
    }

    if (post.visibility === PostVisibility.PRIVATE) {
      if (!userId || (post.user.id !== userId && !post.user.followers.some(follower => follower.id === userId))) {
        throw new UnauthorizedException('This post is private.');
      }
    }

    if (post.tokenGated) {
      if (userId) {
        const user = await this.usersService.findOneById(userId);
        const hasAccess = await this.tokenGatedContentService.hasAccess(user, post);
        if (hasAccess) {
          // Record view interaction for content recommendation
          if (post.tags && user) {
            await this.postsRepository.increment({ id }, 'viewCount', 1);
            await this.userInterestsService.recordInteraction(user, post.tags, 'view');
          }
          return post;
        }
        return {
          ...post,
          content: 'This content is token-gated.',
          media: [],
        };
      }
      return {
        ...post,
        content: 'This content is token-gated.',
        media: [],
      };
    }

    if (post.subscriptionGated) {
      if (userId) {
        // Check if user is the creator or an active subscriber
        if (post.user.id === userId) {
          return post;
        }
        const subscriptions = await this.subscriptionsRepository.find({
          where: {
            creator: { id: post.user.id },
            subscriber: { id: userId },
            status: 'active'
          }
        });
        if (subscriptions.length > 0) {
          // Record view interaction for content recommendation
          if (post.tags && userId) {
            const user = await this.usersService.findOneById(userId);
            await this.postsRepository.increment({ id }, 'viewCount', 1);
            await this.userInterestsService.recordInteraction(user, post.tags, 'view');
          }
          return post;
        }
        return {
          ...post,
          content: 'This content is exclusive to subscribers. Subscribe to access.',
          media: [],
        };
      }
      return {
        ...post,
        content: 'This content is exclusive to subscribers. Subscribe to access.',
        media: [],
      };
    }

    // Record view interaction for content recommendation
    if (userId && post.user.id !== userId) { // Don't increment view count when owner views their own post
      await this.postsRepository.increment({ id }, 'viewCount', 1);
      if (post.tags) {
        const user = await this.usersService.findOneById(userId);
        await this.userInterestsService.recordInteraction(user, post.tags, 'view');
      }
    }

    return post;
  }

  async findAll(
    userId?: string,
    take = 10,
    skip = 0,
  ): Promise<Post[]> {
    let posts: Post[];
    if (userId) {
      const user = await this.usersService.findOneById(userId, ['following']);
      const followingIds = user ? user.following.map((followed) => followed.id) : [];

      posts = await this.postsRepository.find({
        where: [
          {
            user: { id: In([...followingIds, userId]) },
            visibility: In([PostVisibility.PUBLIC, PostVisibility.PRIVATE, PostVisibility.UNLISTED]),
          },
          {
            visibility: PostVisibility.PUBLIC,
          },
        ],
        order: {
          isPinned: 'DESC',
          pinnedAt: 'DESC',
          createdAt: 'DESC',
        },
        relations: ['user', 'likes', 'likes.user'],
        take,
        skip,
      });

      if (user) {
        posts = await Promise.all(
          posts.map(async (post) => {
            const hasAccess = await this.tokenGatedContentService.hasAccess(user, post);
            if (hasAccess) {
              return post;
            }
            return {
              ...post,
              content: 'This content is token-gated.',
              mediaUrl: null,
              mediaType: null,
            };
          }),
        );
      }
    } else {
      // For logged-out users, return only public posts
      posts = await this.postsRepository.find({
        where: {
          visibility: PostVisibility.PUBLIC,
        },
        order: {
          isPinned: 'DESC',
          pinnedAt: 'DESC',
          createdAt: 'DESC',
        },
        relations: ['user', 'likes', 'likes.user'],
        take,
        skip,
      });
    }

    return posts;
  }

  async like(postId: string, userPayload: { userId: string }): Promise<Post> {
    const post = await this.findOne(postId, userPayload.userId);
    const user = await this.usersService.findOneById(userPayload.userId);

    if (!post) {
      throw new Error('Post not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    const existingReaction = await this.postReactionsRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });

    if (existingReaction) {
      return post;
    }

    const reaction = this.postReactionsRepository.create({
      post,
      user,
    });
    await this.postReactionsRepository.save(reaction);
    await this.reputationService.addReputation(ReputationEvent.POST_LIKED, user);

    if (post.tags) {
      await this.userInterestsService.recordInteraction(user, post.tags, 'like');
    }

    await this.notificationsService.createNotification(
      post.user,
      NotificationType.LIKE,
      { userId: user.id, postId: post.id }
    );

    return this.findOne(postId);
  }

  async unlike(postId: string, userPayload: { userId: string }): Promise<Post> {
    const post = await this.findOne(postId, userPayload.userId);
    const user = await this.usersService.findOneById(userPayload.userId);

    if (!post) {
      throw new Error('Post not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    const existingReaction = await this.postReactionsRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });

    if (existingReaction) {
      await this.postReactionsRepository.remove(existingReaction);
    }

    return this.findOne(postId, userPayload.userId);
  }

  async share(postId: string, userPayload: { userId: string }): Promise<Post> {
    const post = await this.findOne(postId, userPayload.userId);
    const user = await this.usersService.findOneById(userPayload.userId);

    if (!post) {
      throw new Error('Post not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    // Increment share count
    await this.postsRepository.increment({ id: postId }, 'shareCount', 1);

    // Record the share interaction for user interests
    if (post.tags) {
      await this.userInterestsService.recordInteraction(user, post.tags, 'share');
    }

    // Add reputation for sharing a post
    await this.reputationService.addReputation(ReputationEvent.POST_LIKED, user);

    // Send notification to post owner
    await this.notificationsService.createNotification(
      post.user,
      NotificationType.SHARE,
      { userId: user.id, postId: post.id }
    );

    return this.findOne(postId, userPayload.userId);
  }

  async update(
    id: string,
    content: string,
    userPayload: { userId: string },
  ): Promise<Post> {
    const post = await this.findOne(id, userPayload.userId);
    if (!post) {
      throw new Error('Post not found');
    }
    if (post.user.id !== userPayload.userId) {
      throw new Error('You are not authorized to update this post');
    }
    post.content = content;
    return this.postsRepository.save(post);
  }

  async remove(id: string, userPayload: { userId: string, role?: string }): Promise<void> {
    const post = await this.findOne(id, userPayload.userId);
    if (!post) {
      throw new Error('Post not found');
    }
    if (post.user.id !== userPayload.userId && userPayload.role !== 'admin') {
      throw new Error('You are not authorized to delete this post');
    }

    try {
      // Manually delete related entities
      await this.postReactionsRepository.delete({ post: { id } });
      await this.commentsRepository.delete({ post: { id } });
      await this.reportsRepository.delete({ post: { id } });

      await this.postsRepository.remove(post as Post);
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to delete post with id: ${id}`, errorStack);
      throw error;
    }
  }

  async archive(postId: string, userId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id: postId }, relations: ['user'] });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('You are not authorized to archive this post');
    }

    if (post.ipfsCid) {
      // Post is already archived
      return post;
    }

    let cid: string;

    // Commented out since Post uses media array instead of mediaUrl
    // if (post.mediaUrl) {
    //   const response = await firstValueFrom(this.httpService.get(post.mediaUrl, { responseType: 'arraybuffer' }));
    //   cid = await this.storageService.upload(response.data);
    // } else {
      cid = await this.storageService.upload(Buffer.from(post.content));
    // }

    post.ipfsCid = cid;
    return this.postsRepository.save(post);
  }

  async repost(postId: string, userPayload: { userId: string }): Promise<Post> {
    const originalPost = await this.findOne(postId, userPayload.userId);
    if (!originalPost) {
      throw new NotFoundException('Original post not found');
    }

    const user = await this.usersService.findOneById(userPayload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRepost = await this.postsRepository.findOne({
      where: {
        repostedFrom: { id: postId },
        user: { id: user.id },
      },
    });

    if (existingRepost) {
      // If the user has already reposted, return the original post
      return originalPost;
    }

    const repost = this.postsRepository.create({
      user,
      repostedFrom: originalPost,
      visibility: originalPost.visibility, // Reposts inherit visibility
    });

    await this.postsRepository.save(repost);

    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await this.postsRepository.save(originalPost);

    await this.reputationService.addReputation(ReputationEvent.REPOST, user);

    return originalPost;
  }

  async undoRepost(postId: string, userPayload: { userId: string }): Promise<Post> {
    const originalPost = await this.findOne(postId, userPayload.userId);
    if (!originalPost) {
      throw new NotFoundException('Original post not found');
    }

    const user = await this.usersService.findOneById(userPayload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const repost = await this.postsRepository.findOne({
      where: {
        repostedFrom: { id: postId },
        user: { id: user.id },
      },
    });

    if (repost) {
      await this.postsRepository.remove(repost);
      originalPost.repostCount = Math.max(0, (originalPost.repostCount || 0) - 1);
      await this.postsRepository.save(originalPost);
    }

    return originalPost;
  }

  async findPostsByHashtag(tag: string, userId?: string): Promise<Post[]> {
    const posts = await this.tagsService.findPostsByTagName(tag.toLowerCase());

    if (!userId) {
      return posts.filter((post) => post.visibility === PostVisibility.PUBLIC);
    }

    const allowedPosts = await Promise.all(
      posts.map(async (post) => {
        if (post.visibility === PostVisibility.PUBLIC) {
          return post;
        }

        if (post.visibility === PostVisibility.UNLISTED || post.user?.id === userId) {
          return post;
        }

        if (
          post.visibility === PostVisibility.PRIVATE &&
          post.user?.followers?.some((follower) => follower.id === userId)
        ) {
          return post;
        }

        return null;
      }),
    );

    return allowedPosts.filter((post): post is Post => Boolean(post));
  }

  async togglePin(id: string, userId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['user'] });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('You are not authorized to pin this post');
    }

    if (!post.isPinned) {
      const pinnedPostsCount = await this.postsRepository.count({ where: { user: { id: userId }, isPinned: true } });
      if (pinnedPostsCount >= 6) {
        const oldestPinnedPost = await this.postsRepository.findOne({ where: { user: { id: userId }, isPinned: true }, order: { pinnedAt: 'ASC' } });
        if (oldestPinnedPost) {
          oldestPinnedPost.isPinned = false;
          oldestPinnedPost.pinnedAt = null;
          await this.postsRepository.save(oldestPinnedPost);
        }
      }
    }

    post.isPinned = !post.isPinned;
    post.pinnedAt = post.isPinned ? new Date() : null;

    return this.postsRepository.save(post);
  }

  async updateShowLikes(id: string, showLikes: boolean, userId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['user'] });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('You are not authorized to update this post');
    }

    post.showLikes = showLikes;
    return this.postsRepository.save(post);
  }

  async feature(postId: string, userPayload: { userId: string }): Promise<Post> {
    const post = await this.findOne(postId, userPayload.userId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userPayload.userId) {
      throw new UnauthorizedException('You are not authorized to feature this post');
    }

    post.isFeatured = true;
    return this.postsRepository.save(post);
  }

  async unfeature(postId: string, userPayload: { userId: string }): Promise<Post> {
    const post = await this.findOne(postId, userPayload.userId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userPayload.userId) {
      throw new UnauthorizedException('You are not authorized to unfeature this post');
    }

    post.isFeatured = false;
    return this.postsRepository.save(post);
  }

  async findPostsByUserId(userId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'likes', 'likes.user', 'comments', 'comments.user', 'tags'],
      order: { createdAt: 'DESC' },
    });
  }
}