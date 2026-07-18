const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');

const Module = require('module');
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '@nestjs/typeorm') {
    return {
      InjectRepository: () => () => undefined,
      InjectDataSource: () => () => undefined,
    };
  }
  if (request === '../trends/trends.service') {
    return {
      TrendsService: class TrendsService {
        async getTrending() {
          return [];
        }
      },
    };
  }
  if (request === '../stories/stories.service') {
    return { StoriesService: class StoriesService {} };
  }
  if (request === '../bookmarks/bookmarks.service') {
    return { BookmarksService: class BookmarksService {} };
  }
  if (request === '../sponsored-posts/sponsored-posts.service') {
    return { SponsoredPostsService: class SponsoredPostsService {} };
  }
  if (request === '../snapmap/snapmap.gateway') {
    return { SnapMapGateway: class SnapMapGateway { userLocations = new Map(); } };
  }
  return originalLoad.apply(this, arguments);
};

const { FeedService } = require('./feed.service');

test('getTrendingFeed ranks posts by engagement and trend relevance', async () => {
  const postsRepository = {
    find: async () => [
      {
        id: 'post-1',
        content: 'AI is changing everything #tech',
        visibility: 'public',
        createdAt: new Date(),
        comments: [{ id: 'c1' }],
        reactions: [{ id: 'r1' }, { id: 'r2' }],
        tags: [{ name: 'tech' }],
        user: { id: 'user-1' },
      },
      {
        id: 'post-2',
        content: 'A normal update',
        visibility: 'public',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        comments: [],
        reactions: [],
        tags: [{ name: 'general' }],
        user: { id: 'user-2' },
      },
    ],
  };

  const trendsService = {
    getTrending: async () => [{ tag: '#tech' }],
  };

  const service = new FeedService(
    postsRepository,
    {},
    {},
    {},
    {},
    {},
    {},
    trendsService,
  );

  const result = await service.getTrendingFeed(null, 10);

  assert.equal(result[0].id, 'post-1');
  assert.equal(result[0].matchedTrends[0], 'tech');
  assert.ok(result[0].trendScore > 0);
});

test('getRecommendedFeed prioritizes interest-matching and recent content', async () => {
  const postsRepository = {
    find: async () => [
      {
        id: 'post-interest',
        content: 'Exciting AI updates for creators',
        visibility: 'public',
        createdAt: new Date(),
        comments: [{ id: 'c1' }, { id: 'c2' }],
        reactions: [{ id: 'r1' }],
        tags: [{ id: 'tag-ai', name: 'ai' }],
        user: { id: 'user-1' },
      },
      {
        id: 'post-older',
        content: 'Travel diary from the mountains',
        visibility: 'public',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        comments: [],
        reactions: [],
        tags: [{ id: 'tag-travel', name: 'travel' }],
        user: { id: 'user-2' },
      },
    ],
  };

  const userInterestsService = {
    getInterests: async () => [{ tag: { id: 'tag-ai' }, score: 24 }],
  };

  const usersService = {
    findFollowingIds: async () => [],
  };

  const trendsService = {
    getTrending: async () => [{ tag: '#ai' }],
  };

  const service = new FeedService(
    postsRepository,
    userInterestsService,
    usersService,
    {},
    {},
    {},
    {},
    trendsService,
  );

  const result = await service.getRecommendedFeed({
    id: 'user-123',
    followedHashtags: [],
    blockedKeywords: [],
    blockedHashtags: [],
    blockedContentTypes: [],
  }, 10);

  assert.equal(result[0].id, 'post-interest');
  assert.ok(result[0].recommendationScore > result[1].recommendationScore);
});

test('getFeed resolves alternate feed views through a single unified entrypoint', async () => {
  const postsRepository = {
    find: async () => [
      {
        id: 'post-chronological',
        content: 'Newest update',
        visibility: 'public',
        createdAt: new Date(),
        comments: [{ id: 'c1' }],
        reactions: [{ id: 'r1' }],
        tags: [{ id: 'tag-ai', name: 'ai' }],
        user: { id: 'user-2' },
      },
    ],
  };

  const userInterestsService = {
    getInterests: async () => [{ tag: { id: 'tag-ai' }, score: 24 }],
  };

  const usersService = {
    findFollowingIds: async () => ['user-2'],
  };

  const trendsService = {
    getTrending: async () => [{ tag: '#ai' }],
  };

  const service = new FeedService(
    postsRepository,
    userInterestsService,
    usersService,
    {},
    {},
    {},
    {},
    trendsService,
  );

  const result = await service.getFeed({ id: 'user-123' }, { view: 'recommended', limit: 10 });

  assert.equal(result[0].id, 'post-chronological');
  assert.ok(result[0].recommendationScore > 0);
});

test('getFeed with friends view only includes posts from followed users', async () => {
  const postsRepository = {
    find: async () => [
      {
        id: 'post-followed',
        content: 'From a friend',
        visibility: 'public',
        createdAt: new Date(),
        comments: [],
        reactions: [],
        tags: [{ name: 'general' }],
        user: { id: 'user-1' },
      },
      {
        id: 'post-stranger',
        content: 'From someone else',
        visibility: 'public',
        createdAt: new Date(),
        comments: [],
        reactions: [],
        tags: [{ name: 'general' }],
        user: { id: 'user-2' },
      },
    ],
  };

  const usersService = {
    findFollowingIds: async () => ['user-1'],
  };

  const service = new FeedService(
    postsRepository,
    {},
    usersService,
    {},
    {},
    {},
    {},
    {},
  );

  const result = await service.getFeed({ id: 'user-test' }, { view: 'friends', limit: 10 });
  const ids = result.map((post) => post.id);

  assert.deepEqual(ids, ['post-followed']);
});

test('getForYouFeed filters out posts with blocked keywords and hashtags', async () => {
  const postsRepository = {
    find: async () => [
      {
        id: 'post-bad-keyword',
        content: 'This contains a spoiler keyword',
        visibility: 'public',
        createdAt: new Date(),
        comments: [],
        reactions: [],
        tags: [{ name: 'general' }],
        user: { id: 'user-1' },
      },
      {
        id: 'post-ok',
        content: 'A wholesome update',
        visibility: 'public',
        createdAt: new Date(),
        comments: [],
        reactions: [],
        tags: [{ name: 'fun' }],
        user: { id: 'user-2' },
      },
      {
        id: 'post-bad-hashtag',
        content: 'Discussing politics',
        visibility: 'public',
        createdAt: new Date(),
        comments: [],
        reactions: [],
        tags: [{ name: 'politics' }],
        user: { id: 'user-3' },
      },
    ],
  };

  const service = new FeedService(
    postsRepository,
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  );

  const user = {
    id: 'user-test',
    blockedKeywords: ['spoiler'],
    blockedHashtags: ['politics'],
    blockedContentTypes: [],
    followedHashtags: [],
  };

  const result = await service.getForYouFeed(user);
  const ids = result.map((r) => r.id);

  // Ensure posts with blocked keyword or hashtag are removed
  assert.ok(!ids.includes('post-bad-keyword'));
  assert.ok(!ids.includes('post-bad-hashtag'));
  assert.ok(ids.includes('post-ok'));
});
