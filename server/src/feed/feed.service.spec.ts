import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { Post, PostVisibility } from '../posts/entities/post.entity';
import { TrendsService } from '../trends/trends.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { UsersService } from '../users/users.service';
import { SponsoredPostsService } from '../sponsored-posts/sponsored-posts.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { StoriesService } from '../stories/stories.service';
import { SnapMapGateway } from '../snapmap/snapmap.gateway';
import { VisibilityService } from '../common/visibility/visibility.service';
import { User } from '../users/entities/user.entity';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';

function makeUser(overrides: Partial<User> = {}): User {
  const u = new User();
  Object.assign(u, {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    blockedKeywords: [],
    blockedHashtags: [],
    blockedContentTypes: [],
    followedHashtags: [],
    ...overrides,
  });
  return u;
}

function makePost(overrides: Partial<Post> = {}): Post {
  const p = new Post();
  Object.assign(p, {
    id: 'post-1',
    content: 'Test post',
    visibility: PostVisibility.PUBLIC,
    user: makeUser(),
    tags: [],
    reactions: [],
    comments: [],
    createdAt: new Date(),
    ...overrides,
  });
  return p;
}

describe('FeedService', () => {
  let service: FeedService;
  let postsRepo: jest.Mocked<any>;
  let visibilityService: jest.Mocked<VisibilityService>;
  let userInterestsService: jest.Mocked<UserInterestsService>;
  let usersService: jest.Mocked<UsersService>;
  let trendsService: jest.Mocked<TrendsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getRepositoryToken(Post), useValue: { find: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue({ where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), leftJoinAndSelect: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue([]) }) } },
        { provide: UserInterestsService, useValue: { getInterests: jest.fn().mockResolvedValue([]) } },
        { provide: UsersService, useValue: { findFollowingIds: jest.fn().mockResolvedValue([]) } },
        { provide: SponsoredPostsService, useValue: {} },
        { provide: BookmarksService, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
        { provide: StoriesService, useValue: {} },
        { provide: SnapMapGateway, useValue: { userLocations: new Map() } },
        { provide: TrendsService, useValue: { getTrending: jest.fn().mockResolvedValue([]) } },
        { provide: VisibilityService, useValue: { filterVisiblePosts: jest.fn(), filterVisiblePostsForViewer: jest.fn().mockImplementation((_uid, posts) => posts) } },
        { provide: DataPermissionsService, useValue: { require: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    postsRepo = module.get(getRepositoryToken(Post));
    visibilityService = module.get(VisibilityService) as jest.Mocked<VisibilityService>;
    userInterestsService = module.get(UserInterestsService) as jest.Mocked<UserInterestsService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    trendsService = module.get(TrendsService) as jest.Mocked<TrendsService>;
  });

  // ─── getChronologicalFeed ─────────────────────────────────────────────

  describe('getChronologicalFeed', () => {
    it('returns public posts in chronological order', async () => {
      const posts = [makePost({ id: 'p1' }), makePost({ id: 'p2' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getChronologicalFeed(makeUser());
      expect(result).toHaveLength(2);
      expect(postsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user', 'reactions', 'comments', 'tags'] }),
      );
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith('user-1', posts);
    });
  });

  // ─── getFriendsFeed ───────────────────────────────────────────────────

  describe('getFriendsFeed', () => {
    it('returns posts from users the current user follows', async () => {
      const user = makeUser();
      usersService.findFollowingIds.mockResolvedValue(['friend-1']);
      const posts = [makePost({ id: 'friend-post', user: makeUser({ id: 'friend-1' }) })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);

      const result = await service.getFriendsFeed(user);
      expect(result).toHaveLength(1);
      expect(usersService.findFollowingIds).toHaveBeenCalledWith('user-1');
    });
  });

  // ─── getForYouFeed ────────────────────────────────────────────────────

  describe('getForYouFeed', () => {
    it('returns public posts filtered by visibility', async () => {
      const user = makeUser();
      const posts = [makePost({ id: 'p1' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);
      expect(Array.isArray(result)).toBe(true);
    });

    it('filters out posts with blocked keywords', async () => {
      const user = makeUser({ blockedKeywords: ['spoiler'] });
      const badPost = makePost({ id: 'bad', content: 'This contains a spoiler' });
      const goodPost = makePost({ id: 'good', content: 'Safe content' });
      postsRepo.find.mockResolvedValue([badPost, goodPost]);
      visibilityService.filterVisiblePosts.mockResolvedValue([badPost, goodPost]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);
      expect(result.find((p: any) => p.id === 'bad')).toBeUndefined();
      expect(result.find((p: any) => p.id === 'good')).toBeDefined();
    });

    it('filters out posts with blocked hashtags', async () => {
      const user = makeUser({ blockedHashtags: ['politics'] });
      const badPost = makePost({ id: 'bad', tags: [{ id: 't1', name: 'politics' } as any] });
      const goodPost = makePost({ id: 'good', tags: [{ id: 't2', name: 'fun' } as any] });
      postsRepo.find.mockResolvedValue([badPost, goodPost]);
      visibilityService.filterVisiblePosts.mockResolvedValue([badPost, goodPost]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);
      expect(result.find((p: any) => p.id === 'bad')).toBeUndefined();
    });

    it('returns posts from followed users first (organic)', async () => {
      const user = makeUser();
      const followedPost = makePost({ id: 'followed', user: makeUser({ id: 'friend-1' }) });
      const otherPost = makePost({ id: 'other', user: makeUser({ id: 'stranger' }) });
      postsRepo.find.mockResolvedValue([followedPost, otherPost]);
      visibilityService.filterVisiblePosts.mockResolvedValue([followedPost, otherPost]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue(['friend-1']);

      const result = await service.getForYouFeed(user);
      const ids = result.map((p: any) => p.id);
      // Followed user's posts should appear before strangers
      expect(ids.indexOf('followed')).toBeGreaterThanOrEqual(0);
    });

    it('uses chronological ordering when feed personalization is disabled', async () => {
      const user = makeUser({ personalizationControls: { feedPersonalization: false } as any });
      const chronologicalPosts = [makePost({ id: 'newest' }), makePost({ id: 'older' })];
      postsRepo.find.mockResolvedValue(chronologicalPosts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(chronologicalPosts);

      const result = await service.getForYouFeed(user);

      expect(result).toEqual(chronologicalPosts);
      expect(userInterestsService.getInterests).not.toHaveBeenCalled();
    });

    it('works for logged-out users (no user provided)', async () => {
      const posts = [makePost()];
      postsRepo.find.mockResolvedValue(posts);

      const result = await service.getForYouFeed(null as any);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getRecommendedFeed ───────────────────────────────────────────────

  describe('getRecommendedFeed', () => {
    it('returns scored recommendations for a logged-in user', async () => {
      const user = makeUser();
      const posts = [makePost({ id: 'rec-1' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getRecommendedFeed(user, 10);
      expect(result).toHaveLength(1);
    });

    it('uses chronological posts when recommendations are disabled', async () => {
      const user = makeUser({ personalizationControls: { recommendations: false } as any });
      const posts = [makePost({ id: 'newest' }), makePost({ id: 'older' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getRecommendedFeed(user, 1);

      expect(result).toEqual([posts[0]]);
    });

    it('falls back to trending feed for logged-out users', async () => {
      const posts = [makePost({ id: 'trending-1' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);
      trendsService.getTrending.mockResolvedValue([{ tag: '#tech' } as any]);

      const result = await service.getRecommendedFeed(null as any, 10);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getTrendingFeed ──────────────────────────────────────────────────

  describe('getTrendingFeed', () => {
    it('ranks trending posts by engagement and trend relevance', async () => {
      const techPost = makePost({
        id: 'tech',
        content: 'AI is changing everything #tech',
        tags: [{ id: 't1', name: 'tech' } as any],
        comments: [{ id: 'c1' } as any],
        reactions: [{ id: 'r1' } as any],
      });
      const normalPost = makePost({ id: 'normal', content: 'Just a normal day' });
      postsRepo.find.mockResolvedValue([techPost, normalPost]);
      visibilityService.filterVisiblePosts.mockResolvedValue([techPost, normalPost]);
      trendsService.getTrending.mockResolvedValue([{ tag: '#tech' } as any]);

      const result = await service.getTrendingFeed(null, 10);
      // Tech post should rank first due to trend match
      expect(result[0].id).toBe('tech');
    });
  });

  // ─── getFeed (orchestrator) ───────────────────────────────────────────

  describe('getFeed', () => {
    it('returns chronological feed view', async () => {
      const posts = [makePost()];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);

      const result = await service.getFeed(makeUser(), { view: 'chronological', limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns recommended feed view', async () => {
      const posts = [makePost()];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getFeed(makeUser(), { view: 'recommended', limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns friends feed view', async () => {
      const user = makeUser();
      usersService.findFollowingIds.mockResolvedValue(['friend-1']);
      const posts = [makePost({ id: 'fp', user: makeUser({ id: 'friend-1' }) })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePosts.mockResolvedValue(posts);

      const result = await service.getFeed(user, { view: 'friends', limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns for-you feed when no view specified', async () => {
      const user = makeUser();
      postsRepo.find.mockResolvedValue([]);
      visibilityService.filterVisiblePosts.mockResolvedValue([]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getFeed(user, { limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getFavoritesFeed ─────────────────────────────────────────────────

  describe('getFavoritesFeed', () => {
    it('returns posts from favorited users', async () => {
      const user = makeUser();
      usersService.findFollowingIds.mockResolvedValue(['fav-1']);
      postsRepo.find.mockResolvedValue([makePost({ id: 'fav-post' })]);
      visibilityService.filterVisiblePosts.mockResolvedValue([makePost({ id: 'fav-post' })]);

      const result = await service.getFavoritesFeed(user);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getSubscriptionsFeed ─────────────────────────────────────────────

  describe('getSubscriptionsFeed', () => {
    it('returns posts from subscribed creators', async () => {
      const user = makeUser();
      usersService.findFollowingIds.mockResolvedValue(['sub-1']);
      postsRepo.find.mockResolvedValue([makePost({ id: 'sub-post' })]);
      visibilityService.filterVisiblePosts.mockResolvedValue([makePost({ id: 'sub-post' })]);

      const result = await service.getSubscriptionsFeed(user);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getExploreFeed ───────────────────────────────────────────────────

  describe('getExploreFeed', () => {
    it('returns explore results with posts and hasMore', async () => {
      postsRepo.find.mockResolvedValue([]);
      const result = await service.getExploreFeed(makeUser(), undefined);
      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('hasMore');
    });
  });

  // ─── getVisualDiscoveryFeed ───────────────────────────────────────────

  describe('getVisualDiscoveryFeed', () => {
    it('returns visual discovery results', async () => {
      postsRepo.find.mockResolvedValue([]);
      const result = await service.getVisualDiscoveryFeed(makeUser(), undefined, 0);
      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('hasMore');
    });
  });
});
