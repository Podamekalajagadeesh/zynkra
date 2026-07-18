import { AppController } from '../src/app.controller';
import { FederationService } from '../src/federation/federation.service';
import { PostsService } from '../src/posts/posts.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/auth/auth.service';

describe('Week 1 readiness checks', () => {
  it('returns a mobile feed and creates mobile posts with a real backend payload', async () => {
    const controller = new AppController(
      new ConfigService(),
      { verifyEmail: jest.fn() } as unknown as AuthService,
    );

    const feed = controller.getMobileFeed();
    expect(Array.isArray(feed)).toBe(true);
    expect(feed.length).toBeGreaterThan(0);

    const created = controller.createMobilePost({
      content: 'Queue recovery test',
      author: 'QA',
      handle: '@qa',
    });

    expect(created.content).toBe('Queue recovery test');
    expect(created.author.name).toBe('QA');
    expect(created.author.handle).toBe('@qa');
  });

  it('rejects encrypted posts that do not include encrypted content', async () => {
    const service = new (PostsService as any)(...Array(24).fill({}));
    service.postsRepository = {
      save: jest.fn(async (post) => ({ ...post, id: 'post-1' })),
    };
    service.usersService = {
      findOneById: jest.fn(async () => ({ id: 'user-1' })),
    };
    service.tagsService = {
      parseAndCreateTags: jest.fn(async () => []),
    };
    service.mentionsService = {
      createMentions: jest.fn(async () => []),
    };
    service.reputationService = {
      addReputation: jest.fn(async () => undefined),
    };
    service.trendsService = {
      extractAndScoreHashtags: jest.fn(async () => undefined),
    };
    service.groupsService = {
      getGroupById: jest.fn(async () => null),
    };
    service.profileReviewService = {
      createForPost: jest.fn(async () => undefined),
    };

    await expect(
      service.create({ userId: 'user-1' }, { content: 'secret', isEncrypted: true }),
    ).rejects.toThrow('Encrypted posts require encryptedContent');
  });

  it('discovers a remote ActivityPub instance using nodeinfo and webfinger metadata', async () => {
    const axios = require('axios');
    const originalGet = axios.get;

    axios.get = jest.fn(async (url: string) => {
      if (url.includes('/.well-known/nodeinfo')) {
        return {
          data: {
            links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0', href: 'https://social.example/nodeinfo/2.0' }],
          },
        };
      }

      if (url.includes('/nodeinfo/2.0')) {
        return {
          data: {
            software: { name: 'mastodon', version: '4.3.0' },
            metadata: { nodeName: 'Social Example' },
          },
        };
      }

      if (url.includes('/.well-known/webfinger')) {
        return {
          data: { links: [{ rel: 'self', type: 'application/activity+json', href: 'https://social.example/users/alice' }] },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const service = new FederationService(
      { findOne: jest.fn(async () => null), create: jest.fn((item) => item), save: jest.fn(async (item) => item) } as any,
      { findOne: jest.fn(async () => null), create: jest.fn((item) => item), save: jest.fn(async (item) => item) } as any,
      { findOne: jest.fn(async () => null), create: jest.fn((item) => item), save: jest.fn(async (item) => item) } as any,
      { get: jest.fn((key: string, fallback?: string) => fallback ?? null) } as any,
      { findOneById: jest.fn(async () => ({ id: 'user-1', username: 'localuser' })), findByUsername: jest.fn(async () => ({ id: 'user-1', username: 'localuser' })) } as any,
      { findPostsByUserId: jest.fn(async () => []) } as any,
    );

    try {
      const result = await service.discoverInstance('social.example');
      expect(result.domain).toBe('social.example');
      expect(result.baseUrl).toBe('https://social.example');
      expect(result.software).toBe('mastodon');
      expect(result.isVerified).toBe(true);
    } finally {
      axios.get = originalGet;
    }
  });
});
