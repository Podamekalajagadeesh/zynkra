import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { Post, PostType, PostVisibility } from '../posts/entities/post.entity';
import { TrendsService } from '../trends/trends.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { UsersService } from '../users/users.service';
import { SponsoredPostsService } from '../sponsored-posts/sponsored-posts.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { StoriesService } from '../stories/stories.service';
import { VisibilityService } from '../common/visibility/visibility.service';
import { User } from '../users/entities/user.entity';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';
import { DataPermission } from '../features/account-management/dto/data-permissions.dto';

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
    postType: PostType.POST,
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
  let dataPermissions: jest.Mocked<DataPermissionsService>;
  let bookmarksService: jest.Mocked<BookmarksService>;
  let storiesService: jest.Mocked<StoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              innerJoin: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getCount: jest.fn().mockResolvedValue(0),
            }),
          },
        },
        {
          provide: UserInterestsService,
          useValue: { getInterests: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: UsersService,
          useValue: {
            findFollowingIds: jest.fn().mockResolvedValue([]),
            getBlockedUsers: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: SponsoredPostsService, useValue: {} },
        { provide: BookmarksService, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
        {
          provide: StoriesService,
          useValue: { findActiveStoriesForUser: jest.fn().mockResolvedValue([]) },
        },
        { provide: TrendsService, useValue: { getTrending: jest.fn().mockResolvedValue([]) } },
        {
          provide: VisibilityService,
          useValue: {
            filterVisiblePosts: jest.fn().mockImplementation((_uid, posts) => posts),
            filterVisiblePostsForViewer: jest.fn().mockImplementation((_uid, posts) => posts),
          },
        },
        {
          provide: DataPermissionsService,
          useValue: {
            require: jest.fn().mockResolvedValue(undefined),
            has: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    postsRepo = module.get(getRepositoryToken(Post));
    visibilityService = module.get(VisibilityService) as jest.Mocked<VisibilityService>;
    userInterestsService = module.get(UserInterestsService) as jest.Mocked<UserInterestsService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    trendsService = module.get(TrendsService) as jest.Mocked<TrendsService>;
    dataPermissions = module.get(DataPermissionsService) as jest.Mocked<DataPermissionsService>;
    bookmarksService = module.get(BookmarksService) as jest.Mocked<BookmarksService>;
    storiesService = module.get(StoriesService) as jest.Mocked<StoriesService>;
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
        expect.objectContaining({
          where: { isDraft: false },
          relations: ['user', 'reactions', 'comments', 'tags'],
        })
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
      expect(ids.indexOf('followed')).toBeLessThan(ids.indexOf('other'));
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

  describe('getShortsFeed', () => {
    it('returns an empty result for anonymous viewers', async () => {
      const result = await service.getShortsFeed(null as any);

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
      expect(userInterestsService.getInterests).not.toHaveBeenCalled();
    });

    it('includes both reel and shorts posts and applies visibility', async () => {
      const user = makeUser();
      const reel = makePost({ id: 'reel', postType: PostType.REEL });
      const shorts = makePost({ id: 'shorts', postType: PostType.SHORTS });
      postsRepo.find.mockResolvedValue([reel, shorts]);
      visibilityService.filterVisiblePosts.mockResolvedValue([reel, shorts]);
      userInterestsService.getInterests.mockResolvedValue([]);

      const result = await service.getShortsFeed(user);

      expect(result).toHaveLength(2);
      expect(postsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDraft: false, postType: expect.anything() }),
          take: 50,
        })
      );
      expect(visibilityService.filterVisiblePosts).toHaveBeenCalledWith('user-1', [reel, shorts]);
    });

    it('filters blocked keywords from shorts', async () => {
      const user = makeUser({ blockedKeywords: ['spoiler'] });
      const blocked = makePost({ id: 'blocked', content: 'A spoiler' });
      const visible = makePost({ id: 'visible', content: 'Safe clip' });
      postsRepo.find.mockResolvedValue([blocked, visible]);
      visibilityService.filterVisiblePosts.mockResolvedValue([blocked, visible]);

      const result = await service.getShortsFeed(user);

      expect(result.map((post) => post.id)).toEqual(['visible']);
    });

    it('skips interest personalization when the user opts out', async () => {
      const user = makeUser({ personalization: false });
      postsRepo.find.mockResolvedValue([]);
      visibilityService.filterVisiblePosts.mockResolvedValue([]);

      await service.getShortsFeed(user);

      expect(userInterestsService.getInterests).not.toHaveBeenCalled();
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
    it('returns posts from active, unexpired subscribed creators', async () => {
      const user = makeUser({
        subscriptions: [
          { status: 'active', creator: { id: 'creator-1' } },
          { status: 'canceled', creator: { id: 'creator-2' } },
          {
            status: 'active',
            expiresAt: new Date(Date.now() - 1000),
            creator: { id: 'creator-3' },
          },
        ] as any,
      });
      const posts = [makePost({ id: 'sub-post' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getSubscriptionsFeed(user);

      expect(result).toHaveLength(1);
      const criteria = postsRepo.find.mock.calls[0][0].where;
      expect(criteria.user.id._value).toEqual(['creator-1']);
      expect(postsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ user: expect.anything() }) })
      );
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

    it('defaults skip to zero and passes a null viewer when the id is missing', async () => {
      const result = await service.getVisualDiscoveryFeed(makeUser({ id: undefined as any }));

      expect(result).toEqual({ posts: [], hasMore: false });
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, []);
    });
  });

  // ─── getForYouFeed — scoring / interleaving / follows ────────────────

  describe('getForYouFeed (scoring and interleaving)', () => {
    it('interleaves followed-hashtag and remaining suggestions after organic chunks', async () => {
      const user = makeUser({
        followedHashtags: [{ id: 'h1', name: 'Tech' } as any],
        blockedKeywords: undefined as any,
      });
      const org1 = makePost({ id: 'org1', user: makeUser({ id: 'friend-1' }) });
      const org2 = makePost({ id: 'org2', user: makeUser({ id: 'friend-2' }) });
      const hash1 = makePost({ id: 'hash1', tags: [{ id: 't1', name: 'Tech' } as any] });
      const hash2 = makePost({ id: 'hash2', tags: [{ id: 't2', name: 'tech' } as any] });
      const rem1 = makePost({ id: 'rem1' });
      const rem2 = makePost({ id: 'rem2' });
      const all = [org1, org2, hash1, hash2, rem1, rem2];
      postsRepo.find.mockResolvedValue(all);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue(['friend-1', 'friend-2']);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['org1', 'org2', 'hash1', 'hash2', 'rem1', 'rem2']);
      expect(result.every((p) => p.isAd === false)).toBe(true);
      expect(result.every((p) => Array.isArray((p as any).algorithmReasons))).toBe(true);
    });

    it('drops posts whose content type is blocked', async () => {
      const user = makeUser({
        blockedContentTypes: ['reel'],
        followedHashtags: undefined as any,
      });
      const reel = makePost({ id: 'reel', postType: PostType.REEL });
      const text = makePost({ id: 'text', postType: PostType.POST });
      postsRepo.find.mockResolvedValue([reel, text]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['text']);
    });

    it('returns only hashtag and suggested posts when there are no organic posts', async () => {
      const user = makeUser({ followedHashtags: [{ id: 'h1', name: 'Tech' } as any] });
      const hash = makePost({ id: 'hash', tags: [{ id: 't1', name: 'Tech' } as any] });
      const rem = makePost({ id: 'rem' });
      postsRepo.find.mockResolvedValue([hash, rem]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['hash', 'rem']);
    });

    it('falls back to the chronological feed when personalization is disabled at the account level', async () => {
      const user = makeUser({ personalization: false });
      const posts = [makePost({ id: 'newest' }), makePost({ id: 'older' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getForYouFeed(user);

      expect(result).toEqual(posts);
      expect(dataPermissions.require).not.toHaveBeenCalled();
      expect(userInterestsService.getInterests).not.toHaveBeenCalled();
    });

    it('propagates personalization permission errors before loading posts', async () => {
      dataPermissions.require.mockRejectedValueOnce(new Error('personalization disabled'));

      await expect(service.getForYouFeed(makeUser())).rejects.toThrow('personalization disabled');
      expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('tolerates missing interest and following lookups', async () => {
      (userInterestsService as any).getInterests = undefined;
      (usersService as any).findFollowingIds = undefined;
      postsRepo.find.mockResolvedValue([]);

      const result = await service.getForYouFeed(makeUser());

      expect(result).toEqual([]);
    });

    it('tolerates missing block lists and posts without tags', async () => {
      const user = makeUser({
        followedHashtags: [{ id: 'h1', name: 'Tech' } as any],
        blockedKeywords: undefined as any,
        blockedHashtags: undefined as any,
        blockedContentTypes: undefined as any,
      });
      const noTags = makePost({ id: 'no-tags', tags: undefined as any });
      const withTags = makePost({ id: 'with-tags', tags: [{ id: 't1', name: 'Tech' } as any] });
      postsRepo.find.mockResolvedValue([noTags, withTags]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['with-tags', 'no-tags']);
    });

    it('filters content when the blocked-keyword list contains a nullish entry', async () => {
      const user = makeUser({ blockedKeywords: [null as any] });
      const withType = makePost({ id: 'with-type', postType: undefined as any, content: 'hello' });
      const withoutContent = makePost({ id: 'without-content', content: undefined as any });
      const withoutTags = makePost({ id: 'without-tags', tags: undefined as any, content: 'more' });
      const namelessTag = makePost({ id: 'nameless-tag', tags: [{} as any], content: 'stuff' });
      postsRepo.find.mockResolvedValue([withType, withoutContent, withoutTags, namelessTag]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['without-content']);
    });

    it('stops interleaving once the suggestion queues are drained', async () => {
      const user = makeUser({ followedHashtags: [{ id: 'h1', name: 'Tech' } as any] });
      const orgs = ['o1', 'o2', 'o3', 'o4'].map((id) =>
        makePost({ id, user: makeUser({ id: `f-${id}` }) })
      );
      const suggestion = makePost({ id: 's1', tags: [{ id: 't1', name: 'Tech' } as any] });
      postsRepo.find.mockResolvedValue([...orgs, suggestion]);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue(['f-o1', 'f-o2', 'f-o3', 'f-o4']);

      const result = await service.getForYouFeed(user);

      expect(result.map((p) => p.id)).toEqual(['o1', 'o2', 'o3', 's1', 'o4']);
    });
  });

  // ─── getRecommendedFeed — deep scoring ───────────────────────────────

  describe('getRecommendedFeed (deep scoring)', () => {
    it('scores posts by interests, follows and hashtag matches while applying blocks', async () => {
      const user = makeUser({
        followedHashtags: [{ id: 'ht1', name: 'Tech' } as any],
        blockedKeywords: ['spoiler'],
        blockedHashtags: ['politics'],
        blockedContentTypes: ['reel'],
      });
      const posts = [
        makePost({
          id: 'p-interest-id',
          user: makeUser({ id: 'friend-1' }),
          tags: [{ id: 't1', name: 'Coding' } as any],
        }),
        makePost({ id: 'p-interest-name', tags: [{ id: 't9', name: 'Design' } as any] }),
        makePost({ id: 'p-hashtag', tags: [{ id: 't5', name: 'Tech' } as any] }),
        makePost({ id: 'p-blocked-tag', tags: [{ id: 't7', name: 'Politics' } as any] }),
        makePost({ id: 'p-blocked-word', content: 'Major spoiler alert' }),
        makePost({ id: 'p-blocked-type', postType: PostType.REEL }),
        makePost({ id: 'p-plain', content: undefined as any, tags: undefined as any }),
        makePost({
          id: 'p-untagged',
          user: undefined as any,
          tags: [{ id: 'x', name: 'unrelated' } as any],
          content: 'plain text',
        }),
        makePost({ id: 'p-zero', tags: [{ id: 't3', name: 'zero' } as any] }),
      ];
      postsRepo.find.mockResolvedValue(posts);
      userInterestsService.getInterests.mockResolvedValue([
        { tag: { id: 't1', name: 'Coding' }, score: 4 } as any,
        { tag: { id: 't2', name: 'design' }, score: 2 } as any,
        { tag: { id: 't3', name: 'zero' }, score: 0 } as any,
      ]);
      usersService.findFollowingIds.mockResolvedValue(['friend-1']);

      const result = await service.getRecommendedFeed(user);

      expect(result.map((p) => p.id)).toEqual([
        'p-interest-id',
        'p-interest-name',
        'p-hashtag',
        'p-plain',
        'p-untagged',
        'p-zero',
      ]);
      expect(result[0].recommendationScore).toBeGreaterThan(result[1].recommendationScore!);
      expect(result[1].recommendationScore).toBeGreaterThan(result[2].recommendationScore!);
      expect(result[0].algorithmReasons).toEqual(
        expect.arrayContaining(['Matches your interests in Coding', 'From someone you follow'])
      );
      expect(result[2].algorithmReasons).toContain('Related to a topic you follow');
      expect(result[2].algorithmReasons).not.toContain('From someone you follow');
      expect(result[3].algorithmReasons).toContain('Broad discovery mix');
      expect(result[4].algorithmReasons).toContain('New creator suggestion');
      expect(dataPermissions.require).toHaveBeenCalledWith(
        'user-1',
        DataPermission.PERSONALIZATION
      );
    });

    it('uses chronological posts when the personalization flag is disabled', async () => {
      const user = makeUser({ personalization: false });
      const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getRecommendedFeed(user, 1);

      expect(result).toEqual([posts[0]]);
      expect(dataPermissions.require).not.toHaveBeenCalled();
    });

    it('propagates personalization permission errors', async () => {
      dataPermissions.require.mockRejectedValueOnce(new Error('no personalization'));

      await expect(service.getRecommendedFeed(makeUser(), 5)).rejects.toThrow('no personalization');
      expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('applies default block lists and tolerates a missing viewer id', async () => {
      const user = makeUser({
        id: undefined as any,
        blockedKeywords: undefined as any,
        blockedHashtags: undefined as any,
        blockedContentTypes: undefined as any,
        followedHashtags: undefined as any,
      });
      const posts = [makePost({ id: 'p1', postType: undefined as any })];
      postsRepo.find.mockResolvedValue(posts);
      userInterestsService.getInterests.mockResolvedValue([]);
      usersService.findFollowingIds.mockResolvedValue([]);

      const result = await service.getRecommendedFeed(user, 5);

      expect(result.map((p) => p.id)).toEqual(['p1']);
      expect(dataPermissions.require).toHaveBeenCalledWith(
        undefined,
        DataPermission.PERSONALIZATION
      );
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, posts);
    });
  });

  // ─── getShortsFeed — blocks, clamps, scoring ─────────────────────────

  describe('getShortsFeed (blocks and scoring)', () => {
    it('applies hashtag/content-type blocks and scores with interests and engagement', async () => {
      const user = makeUser({
        blockedKeywords: undefined as any,
        blockedHashtags: ['Spoiler-Tag'],
        blockedContentTypes: ['reel'],
      });
      const reel = makePost({ id: 'reel', postType: PostType.REEL });
      const blockedTag = makePost({
        id: 'blocked-tag',
        tags: [{ id: 't8', name: 'spoiler-tag' } as any],
      });
      const music = makePost({
        id: 'music',
        tags: [{ id: 't1', name: 'music' } as any],
        comments: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}` }) as any),
        reactions: Array.from({ length: 25 }, (_, i) => ({ id: `r${i}` }) as any),
        shareCount: 3,
      });
      const plain = makePost({
        id: 'plain',
        reactions: undefined as any,
        comments: undefined as any,
      });
      const orphan = makePost({ id: 'orphan', user: undefined as any, tags: undefined as any });
      const unmatched = makePost({ id: 'unmatched', tags: [{ id: 'zz', name: 'cooking' } as any] });
      const noType = makePost({
        id: 'no-type',
        postType: undefined as any,
        tags: undefined as any,
        content: undefined as any,
      });

      postsRepo.find.mockResolvedValue([reel, blockedTag, music, plain, orphan, unmatched, noType]);
      userInterestsService.getInterests.mockResolvedValue([
        { tag: { id: 't1', name: 'music' }, score: 3 } as any,
      ]);

      const result = await service.getShortsFeed(user, 200);

      expect(result.map((p) => p.id)).toEqual(['music', 'plain', 'orphan', 'unmatched', 'no-type']);
      expect(postsRepo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
      expect(dataPermissions.has).toHaveBeenCalledWith('user-1', DataPermission.PERSONALIZATION);
    });

    it('clamps a non-positive limit to one take and skips interests when permission is missing', async () => {
      const user = makeUser({
        blockedKeywords: undefined as any,
        blockedHashtags: undefined as any,
        blockedContentTypes: undefined as any,
      });
      dataPermissions.has.mockResolvedValue(false);
      postsRepo.find.mockResolvedValue([]);

      await service.getShortsFeed(user, 0);

      expect(postsRepo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
      expect(userInterestsService.getInterests).not.toHaveBeenCalled();
    });
  });

  // ─── getFavoritesFeed (edge paths) ───────────────────────────────────

  describe('getFavoritesFeed (edge paths)', () => {
    it('returns an empty list for anonymous viewers', async () => {
      const result = await service.getFavoritesFeed(null as any);

      expect(result).toEqual([]);
      expect(bookmarksService.findAll).not.toHaveBeenCalled();
    });

    it('keeps only non-draft bookmarked posts', async () => {
      const user = makeUser();
      bookmarksService.findAll.mockResolvedValue([
        { post: makePost({ id: 'kept' }) },
        { post: null },
        { post: makePost({ id: 'draft', isDraft: true }) },
        { post: makePost({ id: 'kept2', isDraft: false }) },
      ] as any);

      const result = await service.getFavoritesFeed(user);

      expect(result.map((p) => p.id)).toEqual(['kept', 'kept2']);
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(
        'user-1',
        expect.any(Array)
      );
    });
  });

  // ─── getFriendsFeed (edge paths) ─────────────────────────────────────

  describe('getFriendsFeed (edge paths)', () => {
    it('returns an empty list for anonymous viewers', async () => {
      const result = await service.getFriendsFeed(null as any);

      expect(result).toEqual([]);
      expect(usersService.findFollowingIds).not.toHaveBeenCalled();
    });

    it('returns an empty list when the user follows nobody', async () => {
      const result = await service.getFriendsFeed(makeUser());

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('falls back to an empty following list when the lookup yields nothing', async () => {
      (usersService as any).findFollowingIds = undefined;

      const result = await service.getFriendsFeed(makeUser());

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── getSubscriptionsFeed (edge paths) ───────────────────────────────

  describe('getSubscriptionsFeed (edge paths)', () => {
    it('returns an empty list for anonymous viewers', async () => {
      const result = await service.getSubscriptionsFeed(null as any);

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('returns an empty list when no subscription yields a creator id', async () => {
      const user = makeUser({
        subscriptions: [
          { status: 'canceled', creator: { id: 'creator-1' } },
          { status: 'expired', creator: { id: 'creator-2' } },
          { status: 'active', creator: undefined },
        ] as any,
      });

      const result = await service.getSubscriptionsFeed(user);

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('returns an empty list when the user has no subscriptions at all', async () => {
      const result = await service.getSubscriptionsFeed(makeUser());

      expect(result).toEqual([]);
      expect(postsRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── getStoryFeed ────────────────────────────────────────────────────

  describe('getStoryFeed', () => {
    it('returns an empty list for anonymous viewers', async () => {
      const result = await service.getStoryFeed(null as any);

      expect(result).toEqual([]);
      expect(usersService.getBlockedUsers).not.toHaveBeenCalled();
      expect(storiesService.findActiveStoriesForUser).not.toHaveBeenCalled();
    });

    it('filters out stories from blocked users', async () => {
      const user = makeUser();
      usersService.getBlockedUsers.mockResolvedValue([makeUser({ id: 'blocked-1' })]);
      storiesService.findActiveStoriesForUser.mockResolvedValue([
        { id: 's1', user: { id: 'user-1' } },
        { id: 's2', user: { id: 'blocked-1' } },
        { id: 's3', user: { id: 'user-2' } },
      ] as any);

      const result = await service.getStoryFeed(user);

      expect(result.map((s: any) => s.id)).toEqual(['s1', 's3']);
      expect(usersService.getBlockedUsers).toHaveBeenCalledWith('user-1');
      expect(storiesService.findActiveStoriesForUser).toHaveBeenCalledWith('user-1');
    });
  });

  // ─── getTrendingFeed (sorting) ───────────────────────────────────────

  describe('getTrendingFeed (sorting)', () => {
    it('filters and ranks multiple trend-matching and discussed posts', async () => {
      const hot = makePost({
        id: 'hot',
        tags: [{ id: 't1', name: 'tech' } as any],
        comments: [{ id: 'c1' } as any, { id: 'c2' } as any, { id: 'c3' } as any],
      });
      const warm = makePost({ id: 'warm', tags: [{ id: 't2', name: 'ai' } as any] });
      const discussed = makePost({
        id: 'discussed',
        comments: [{ id: 'c4' } as any, { id: 'c5' } as any],
      });
      postsRepo.find.mockResolvedValue([warm, discussed, hot]);
      trendsService.getTrending.mockResolvedValue([{ tag: '#tech' } as any, { tag: '#ai' } as any]);

      const result = await service.getTrendingFeed(null, 10);

      expect(result.map((p) => p.id)).toEqual(['hot', 'warm', 'discussed']);
      expect(result[0].matchedTrends).toEqual(['tech']);
      expect(result[2].matchedTrends).toEqual([]);
      expect(result[2].trendScore).toBeGreaterThan(0);
    });

    it('handles missing trends, untagged posts and a default limit', async () => {
      trendsService.getTrending.mockResolvedValue(undefined as any);
      const untagged = makePost({
        id: 'untagged',
        tags: undefined as any,
        comments: [{ id: 'a' } as any, { id: 'b' } as any],
      });
      postsRepo.find.mockResolvedValue([untagged]);

      const result = await service.getTrendingFeed(null);

      expect(result.map((p) => p.id)).toEqual(['untagged']);
      expect(result[0].matchedTrends).toEqual([]);
      expect(trendsService.getTrending).toHaveBeenCalledWith(20, 7);
    });
  });

  // ─── getExploreFeed (category filtering) ─────────────────────────────

  describe('getExploreFeed (category filtering)', () => {
    it('filters by a known category keyword and flags a full page', async () => {
      const qb = postsRepo.createQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 30 }, (_, i) => makePost({ id: `p${i}` }))
      );

      const result = await service.getExploreFeed(makeUser(), 'nature');

      expect(qb.andWhere).toHaveBeenCalledWith('tags.name IN (:...keywords)', {
        keywords: ['nature', 'outdoors', 'wildlife', 'forest', 'ocean', 'mountain', 'sunset'],
      });
      expect(result.posts).toHaveLength(30);
      expect(result.hasMore).toBe(true);
    });

    it('ignores an unknown category', async () => {
      const qb = postsRepo.createQueryBuilder();

      const result = await service.getExploreFeed(makeUser(), 'nonexistent');

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'tags.name IN (:...keywords)',
        expect.anything()
      );
      expect(result.hasMore).toBe(false);
    });

    it('passes a null viewer when the user id is missing', async () => {
      const result = await service.getExploreFeed(makeUser({ id: undefined as any }));

      expect(result.posts).toEqual([]);
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, []);
    });
  });

  // ─── getExploreCategories ────────────────────────────────────────────

  describe('getExploreCategories', () => {
    it('returns curated categories with counts and trending keywords', async () => {
      trendsService.getTrending.mockResolvedValue([
        { tag: '#nature' } as any,
        { tag: '#outdoors' } as any,
        { tag: '#wildlife' } as any,
        { tag: '#forest' } as any,
        { tag: '#travel' } as any,
      ]);
      const qb = postsRepo.createQueryBuilder();
      (qb.getCount as jest.Mock).mockResolvedValue(42);

      const result = await service.getExploreCategories();

      expect(result.categories).toHaveLength(5);
      expect(result.categories[0]).toEqual({
        id: 'nature',
        name: 'Nature',
        count: 42,
        trending: ['nature', 'outdoors', 'wildlife'],
      });
      expect(result.categories[1]).toEqual(
        expect.objectContaining({ id: 'travel', name: 'Travel', trending: ['travel'] })
      );
      expect(result.categories[2]).toEqual(
        expect.objectContaining({ id: 'food', name: 'Food', trending: [] })
      );
      expect(result.categories[3]).toEqual(
        expect.objectContaining({ id: 'art', name: 'Art', trending: [] })
      );
      expect(result.categories[4]).toEqual(
        expect.objectContaining({ id: 'fashion', name: 'Fashion', trending: [] })
      );
      expect(trendsService.getTrending).toHaveBeenCalledWith(25);
    });
  });

  // ─── getVisualCategories ─────────────────────────────────────────────

  describe('getVisualCategories', () => {
    it('returns the static visual category catalogue', async () => {
      const result = await service.getVisualCategories();

      expect(result.categories).toHaveLength(8);
      expect(result.categories.map((c) => c.id)).toEqual([
        'nature',
        'travel',
        'food',
        'art',
        'fashion',
        'animals',
        'architecture',
        'photography',
      ]);
      expect(result.categories[0]).toEqual(
        expect.objectContaining({ name: 'Nature & Landscapes', postCount: 1250 })
      );
      expect(result.categories[5]).toEqual(
        expect.objectContaining({ name: 'Animals & Pets', imageUrl: expect.any(String) })
      );
    });
  });

  // ─── getFeed (remaining views and clamping) ──────────────────────────

  describe('getFeed (remaining views and clamping)', () => {
    it('returns subscriptions feed view', async () => {
      const user = makeUser({
        subscriptions: [{ status: 'active', creator: { id: 'creator-1' } }] as any,
      });
      const posts = [makePost({ id: 'sub-1' })];
      postsRepo.find.mockResolvedValue(posts);

      const result = await service.getFeed(user, { view: 'subscriptions', limit: 5 });

      expect(result.map((p) => p.id)).toEqual(['sub-1']);
    });

    it('returns favorites feed view', async () => {
      const user = makeUser();
      bookmarksService.findAll.mockResolvedValue([{ post: makePost({ id: 'fav-1' }) }] as any);

      const result = await service.getFeed(user, { view: 'favorites' });

      expect(result.map((p) => p.id)).toEqual(['fav-1']);
    });

    it('returns trending feed view for anonymous viewers', async () => {
      const post = makePost({ id: 't-1', tags: [{ id: 'x', name: 'tech' } as any] });
      postsRepo.find.mockResolvedValue([post]);
      trendsService.getTrending.mockResolvedValue([{ tag: '#tech' } as any]);

      const result = await service.getFeed(null as any, { view: 'trending', limit: 5 });

      expect(result.map((p) => p.id)).toEqual(['t-1']);
    });

    it('applies default options when none are given', async () => {
      postsRepo.find.mockResolvedValue([]);

      const result = await service.getFeed(makeUser());

      expect(result).toEqual([]);
    });

    it('clamps a non-positive limit to one post', async () => {
      const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getFeed(makeUser(), { view: 'chronological', limit: -3 });

      expect(result).toHaveLength(1);
    });

    it('treats a zero limit as the default page size', async () => {
      const posts = [makePost({ id: 'a' }), makePost({ id: 'b' }), makePost({ id: 'c' })];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getFeed(makeUser(), { view: 'chronological', limit: 0 });

      expect(result).toHaveLength(3);
    });
  });

  // ─── getChronologicalFeed (anonymous) ────────────────────────────────

  describe('getChronologicalFeed (anonymous)', () => {
    it('passes a null viewer for logged-out users', async () => {
      const posts = [makePost()];
      postsRepo.find.mockResolvedValue(posts);
      visibilityService.filterVisiblePostsForViewer.mockResolvedValue(posts);

      const result = await service.getChronologicalFeed(null as any);

      expect(result).toHaveLength(1);
      expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, posts);
    });
  });
});
