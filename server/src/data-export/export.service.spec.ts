import { NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import { ConversationType } from '../dms/conversation-type.enum';

const configStub = { get: jest.fn((key: string, fallback?: unknown) => fallback) };

const emptyRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
});

describe('ExportService data permissions', () => {
  it('exports personalization and analytics only when permitted', async () => {
    const usersRepository = emptyRepository();
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      username: 'test-user',
      accountDataPermissions: ['profile', 'personalization', 'analytics'],
      accountPreferences: { theme: 'dark', language: 'en' },
      personalization: true,
      adPersonalization: false,
      personalizationControls: { feedPersonalization: false },
    });
    const messagesRepository = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };
    const repositories = [
      usersRepository,
      emptyRepository(),
      messagesRepository,
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
    ];
    const service = Reflect.construct(ExportService, [
      ...repositories,
      configStub,
    ]) as ExportService;

    const permitted = await service.exportUserData('user-1');

    expect(permitted.personalization).toEqual({
      accountPreferences: { theme: 'dark', language: 'en' },
      privacy: {
        personalization: true,
        adPersonalization: false,
        personalizationControls: { feedPersonalization: false },
      },
    });
    expect(permitted.analytics).toEqual(
      expect.objectContaining({
        posts: { count: 0, comments: 0, reactions: 0 },
        audience: { following: 0, followers: 0 },
      })
    );
    expect(permitted.exportManifest.enabledCategories).toEqual([
      'profile',
      'personalization',
      'analytics',
    ]);
  });

  it('omits personalization and analytics data when disabled', async () => {
    const usersRepository = emptyRepository();
    usersRepository.findOne.mockResolvedValue({
      id: 'user-2',
      username: 'test-user',
      accountDataPermissions: ['profile'],
    });
    const messagesRepository = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    const repositories = [
      usersRepository,
      emptyRepository(),
      messagesRepository,
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
      emptyRepository(),
    ];
    const service = Reflect.construct(ExportService, [
      ...repositories,
      configStub,
    ]) as ExportService;

    const restricted = await service.exportUserData('user-2');

    expect(restricted.personalization).toEqual({});
    expect(restricted.analytics).toEqual({});
    expect(restricted.exportManifest.omittedCategories).toEqual(
      expect.arrayContaining(['personalization', 'analytics'])
    );
  });
});

const SERVICE_KEYS = [
  'users',
  'posts',
  'messages',
  'conversations',
  'comments',
  'reactions',
  'follows',
  'bookmarks',
  'stories',
  'groupMembers',
  'notifications',
  'orders',
  'ledger',
  'articles',
  'podcasts',
  'courses',
  'enrollments',
  'dataExports',
  'verification',
  'connectedAccounts',
] as const;

type RepoKey = (typeof SERVICE_KEYS)[number];

const buildService = (overrides: Partial<Record<RepoKey, Record<string, any>>> = {}) => {
  const repos = {} as Record<RepoKey, Record<string, any>>;
  const ordered = SERVICE_KEYS.map((key) => {
    const repository: Record<string, any> = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue([]),
      save: jest
        .fn()
        .mockImplementation((...args: any[]) =>
          Promise.resolve(args.length > 1 ? args[1] : args[0])
        ),
      create: jest.fn().mockImplementation((_entity: any, value: any) => value),
      createQueryBuilder: jest.fn(),
      ...overrides[key],
    };
    repos[key] = repository;
    return repository;
  });
  return {
    service: Reflect.construct(ExportService, [...ordered, configStub]) as ExportService,
    repos,
  };
};

const buildImportManager = (
  options: {
    user?: any;
    peers?: Record<string, any>;
    targets?: any[];
    existingFollows?: any[];
    existingConversations?: any[];
  } = {}
) => {
  const saves: Array<{ entity: string; value: any }> = [];
  const manager = {
    findOne: jest.fn(async (entity: any, findOptions: any) => {
      if (entity.name === 'User') {
        if (findOptions?.where && 'id' in findOptions.where) return options.user ?? null;
        const username = findOptions?.where?.username;
        return (username && options.peers?.[username]) || null;
      }
      return null;
    }),
    find: jest.fn(async (entity: any) => {
      if (entity.name === 'User') return options.targets ?? [];
      if (entity.name === 'Follow') return options.existingFollows ?? [];
      if (entity.name === 'Conversation') return options.existingConversations ?? [];
      return [];
    }),
    create: jest.fn((_entity: any, value: any) => value),
    save: jest.fn(async (entity: any, value: any) => {
      if (!value.id) value.id = `${entity.name.toLowerCase()}-${saves.length + 1}`;
      saves.push({ entity: entity.name, value });
      return value;
    }),
  };
  const transaction = jest.fn(async (callback: any) => callback(manager));
  return { manager, saves, transaction };
};

const T1 = new Date('2025-01-01T00:00:00.000Z');
const T2 = new Date('2025-01-02T00:00:00.000Z');
const USER_CREATED_AT = new Date('2024-06-01T00:00:00.000Z');

const fullUser = () => ({
  id: 'user-1',
  username: 'ada',
  email: 'ada@example.com',
  displayName: 'Ada',
  bio: 'builder',
  avatar: 'a.png',
  header: 'h.png',
  pronouns: 'she/her',
  createdAt: USER_CREATED_AT,
  accountType: 'creator',
  verified: true,
  walletAddress: '0xabc',
  accountDataPermissions: [
    'profile',
    'posts',
    'messages',
    'personalization',
    'analytics',
    'connected_services',
    'settings',
  ],
  accountPreferences: { theme: 'dark' },
  personalization: true,
  adPersonalization: false,
  personalizationControls: { feedPersonalization: true },
  postVisibility: 'public',
  commentPrivacy: 'mutual',
  messagePrivacy: 'everyone',
  profileTheme: 'dark',
  profileThemeColor: '#112233',
  notificationSettings: { likes: true },
  followedHashtags: ['ai'],
  blockedKeywords: ['spam'],
  blockedHashtags: ['bad'],
  blockedContentTypes: ['nsfw'],
  closeFriends: [{ username: 'buddy' }],
});

const fullRepositories = (
  receivedMessages: any[] = []
): Partial<Record<RepoKey, Record<string, any>>> => ({
  posts: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'p1',
        content: 'first post',
        postType: 'feed',
        visibility: 'public',
        createdAt: T1,
        media: [{ url: 'u1', type: 'image', sortOrder: 0, altText: 'alt' }],
        reelEffect: null,
      },
      {
        id: 'p2',
        content: 'reel caption',
        postType: 'reel',
        visibility: 'public',
        createdAt: T1,
        media: [{ url: 'r2', type: 'video', sortOrder: 0, altText: null }],
        reelEffect: { id: 'fx-1' },
      },
      { id: 'p3', content: 'third post', postType: 'feed', visibility: 'followers', createdAt: T1 },
      {
        id: 'p4',
        content: 'second reel',
        postType: 'reel',
        visibility: 'public',
        createdAt: T1,
        reelEffect: { id: 'fx-2' },
      },
    ]),
  },
  messages: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'm1',
        content: 'sent one',
        conversation: { id: 'c1' },
        mediaType: 'text',
        mediaUrl: null,
        media: null,
        voiceNote: null,
        senderPublicKey: null,
        createdAt: T1,
      },
      {
        id: 'm2',
        content: 'sent two',
        conversation: { id: 'c1' },
        mediaType: 'video',
        mediaUrl: 'https://v',
        media: { url: 'x' },
        voiceNote: 'note',
        senderPublicKey: 'pk',
        createdAt: T2,
      },
    ]),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(receivedMessages),
    })),
  },
  conversations: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'c1',
        type: ConversationType.ONE_TO_ONE,
        name: null,
        isEncrypted: true,
        participants: [
          { id: 'user-1', username: 'ada' },
          { id: 'peer', username: 'pal' },
        ],
      },
      {
        id: 'c2',
        type: ConversationType.GROUP,
        name: 'Squad',
        isEncrypted: false,
        participants: [{ id: 'user-1', username: 'ada' }],
      },
    ]),
  },
  comments: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'cm1',
        content: 'nice',
        post: { id: 'p1' },
        parent: { id: 'cm0' },
        sentiment: 'positive',
        createdAt: T1,
      },
      { id: 'cm2', content: 'reply', post: { id: 'p2' }, sentiment: null, createdAt: T1 },
      { id: 'cm3', content: 'orphan' },
    ]),
  },
  reactions: {
    find: jest.fn().mockResolvedValue([{ id: 'r1', reaction: 'like', post: { id: 'p1' } }]),
  },
  follows: {
    find: jest
      .fn()
      .mockResolvedValueOnce([{ following: { id: 'u2', username: 'friend' }, followedAt: T1 }])
      .mockResolvedValueOnce([{ follower: { id: 'u3', username: 'fan' }, followedAt: T2 }]),
  },
  bookmarks: {
    find: jest.fn().mockResolvedValue([{ id: 'b1', post: { id: 'p1' }, createdAt: T1 }]),
  },
  stories: {
    find: jest.fn().mockResolvedValue([
      {
        id: 's1',
        textContent: 'story one',
        mediaUrl: 's1.png',
        audience: 'public',
        createdAt: T1,
        expiresAt: T2,
        backgroundOptions: { color: 'red' },
        arFilterName: 'neon',
        music: 'song.mp3',
        elements: [{ id: 'e1', type: 'text', zIndex: 1, story: { id: 's1' } }],
      },
      { id: 's2', textContent: 'story two', mediaUrl: null, createdAt: T1, expiresAt: T2 },
    ]),
  },
  groupMembers: {
    find: jest.fn().mockResolvedValue([{ group: { id: 'g1', name: 'Gardening' }, role: 'owner' }]),
  },
  notifications: {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: 'n1', type: 'like', data: { postId: 'p1' }, read: false, createdAt: T1 },
      ]),
  },
  orders: {
    find: jest
      .fn()
      .mockResolvedValue([{ id: 'o1', total: 42, status: 'paid', items: [{}, {}], createdAt: T1 }]),
  },
  ledger: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'l1',
        type: 'earning',
        amount: 5,
        balanceAfter: 10,
        currency: 'usd',
        reference: 'ref',
        purpose: 'payout',
        createdAt: T1,
      },
    ]),
  },
  articles: {
    find: jest
      .fn()
      .mockResolvedValue([{ id: 'a1', title: 'Article', content: 'words', publishedAt: T1 }]),
  },
  podcasts: {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: 'po1', title: 'Podcast', description: 'talk', audioUrl: 'a.mp3', createdAt: T1 },
      ]),
  },
  courses: {
    find: jest
      .fn()
      .mockResolvedValue([{ id: 'co1', title: 'Course', description: 'learn', createdAt: T1 }]),
  },
  enrollments: {
    find: jest
      .fn()
      .mockResolvedValue([{ courseId: 'co1', progress: 60, isCompleted: false, createdAt: T1 }]),
  },
  verification: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'v1',
        workflow: 'personal',
        category: 'id',
        organizationName: null,
        documentType: null,
        justification: 'j',
        links: ['https://l'],
        status: 'pending',
        reviewNote: null,
        createdAt: T1,
        updatedAt: T2,
      },
    ]),
  },
  connectedAccounts: {
    find: jest.fn().mockResolvedValue([
      {
        id: 'ca1',
        platform: 'google',
        platformUsername: 'ada',
        platformUserId: '1',
        isActive: true,
        createdAt: T1,
      },
    ]),
  },
});

describe('ExportService.exportUserData', () => {
  it('throws NotFoundException when the account no longer exists', async () => {
    const { service } = buildService({ users: { findOne: jest.fn().mockResolvedValue(null) } });

    await expect(service.exportUserData('missing-user')).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([null, undefined])(
    'falls back to the default data permissions when accountDataPermissions is %p',
    async (permissions) => {
      const { service, repos } = buildService({
        users: {
          findOne: jest.fn().mockResolvedValue({
            id: 'user-1',
            username: 'test-user',
            accountDataPermissions: permissions,
          }),
        },
      });

      const result = await service.exportUserData('user-1');

      expect(result.exportManifest.enabledCategories).toEqual([
        'profile',
        'posts',
        'settings',
        'personalization',
      ]);
      expect(result.exportManifest.omittedCategories).toEqual([
        'messages',
        'analytics',
        'connected_services',
      ]);
      expect(result.messages).toEqual([]);
      expect(result.reels).toEqual([]);
      expect(result.analytics).toEqual({});
      expect(result.personalization).toEqual({
        accountPreferences: {},
        privacy: { personalization: null, adPersonalization: null, personalizationControls: {} },
      });
      expect(result.settings).toStrictEqual({
        postVisibility: undefined,
        commentPrivacy: undefined,
        messagePrivacy: undefined,
        profileTheme: undefined,
        profileThemeColor: undefined,
        notificationSettings: undefined,
        followedHashtags: undefined,
        blockedKeywords: undefined,
        blockedHashtags: undefined,
        blockedContentTypes: undefined,
        closeFriends: undefined,
      });
      expect(result.user).toMatchObject({ id: 'user-1', username: 'test-user' });
      expect(repos.messages.find).not.toHaveBeenCalled();
      expect(repos.messages.createQueryBuilder).not.toHaveBeenCalled();
      expect(repos.orders.find).not.toHaveBeenCalled();
      expect(repos.ledger.find).not.toHaveBeenCalled();
      expect(repos.connectedAccounts.find).not.toHaveBeenCalled();
      expect(repos.verification.find).toHaveBeenCalled();
      expect(repos.notifications.find).toHaveBeenCalled();
      expect(repos.follows.find).toHaveBeenCalledTimes(2);
      expect(result.version).toBe('2.1.0');
      expect(Number.isNaN(Date.parse(result.exportedAt))).toBe(false);
    }
  );

  it('skips the received-message query when the account has no conversations', async () => {
    const { service, repos } = buildService({
      users: {
        findOne: jest.fn().mockResolvedValue({
          id: 'user-1',
          username: 'test-user',
          accountDataPermissions: ['messages'],
        }),
      },
    });

    const result = await service.exportUserData('user-1');

    expect(repos.conversations.find).toHaveBeenCalledTimes(1);
    expect(repos.messages.createQueryBuilder).not.toHaveBeenCalled();
    expect(repos.follows.find).not.toHaveBeenCalled();
    expect(repos.notifications.find).not.toHaveBeenCalled();
    expect(result.messages).toEqual([]);
    expect(result.user).toEqual({ id: 'user-1' });
    expect(result.settings).toEqual({});
    expect(result.personalization).toEqual({});
    expect(result.analytics).toEqual({});
    expect(result.follows).toEqual({ following: [], followers: [] });
    expect(result.exportManifest.enabledCategories).toEqual(['messages']);
  });

  it('exports every content type when all data permissions are granted', async () => {
    const { service, repos } = buildService({
      users: { findOne: jest.fn().mockResolvedValue(fullUser()) },
      ...fullRepositories([
        {
          id: 'm3',
          content: 'received one',
          conversation: { id: 'c1' },
          sender: { id: 'peer' },
          mediaType: 'text',
          mediaUrl: null,
          media: null,
          voiceNote: null,
          senderPublicKey: null,
          createdAt: T1,
        },
      ]),
    });

    const result = await service.exportUserData('user-1');

    expect(result.user).toStrictEqual({
      id: 'user-1',
      username: 'ada',
      email: 'ada@example.com',
      displayName: 'Ada',
      bio: 'builder',
      avatar: 'a.png',
      header: 'h.png',
      pronouns: 'she/her',
      createdAt: USER_CREATED_AT,
      accountType: 'creator',
      verified: true,
      walletAddress: '0xabc',
    });
    expect(result.posts.map((post) => post.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(result.posts[0].media).toEqual([
      { url: 'u1', type: 'image', sortOrder: 0, altText: 'alt' },
    ]);
    expect(result.posts[2].media).toEqual([]);
    expect(result.posts[1]).toEqual(
      expect.objectContaining({ isReel: true, postType: 'reel', visibility: 'public' })
    );
    expect(result.reels).toEqual([
      { id: 'p2', mediaUrl: 'r2', caption: 'reel caption' },
      { id: 'p4', mediaUrl: null, caption: 'second reel' },
    ]);
    expect(result.comments).toEqual([
      {
        id: 'cm1',
        content: 'nice',
        postId: 'p1',
        parentId: 'cm0',
        sentiment: 'positive',
        createdAt: T1,
      },
      { id: 'cm2', content: 'reply', postId: 'p2', parentId: null, sentiment: null, createdAt: T1 },
      {
        id: 'cm3',
        content: 'orphan',
        postId: undefined,
        parentId: null,
        sentiment: undefined,
        createdAt: undefined,
      },
    ]);
    expect(result.reactions).toEqual([{ id: 'r1', reaction: 'like', postId: 'p1' }]);
    expect(result.follows).toEqual({
      following: [{ username: 'friend', userId: 'u2', followedAt: T1 }],
      followers: [{ username: 'fan', userId: 'u3', followedAt: T2 }],
    });
    expect(result.bookmarks).toEqual([{ id: 'b1', postId: 'p1', createdAt: T1 }]);
    expect(result.stories).toHaveLength(2);
    expect(result.stories[0]).toEqual(
      expect.objectContaining({
        textContent: 'story one',
        backgroundOptions: { color: 'red' },
        arFilterName: 'neon',
        music: 'song.mp3',
      })
    );
    expect(result.stories[0].elements).toEqual([{ type: 'text', zIndex: 1 }]);
    expect(result.stories[1].elements).toEqual([]);
    expect(result.messages).toEqual([
      {
        id: 'm1',
        content: 'sent one',
        direction: 'sent',
        conversationId: 'c1',
        mediaType: 'text',
        mediaUrl: null,
        media: null,
        voiceNote: null,
        senderPublicKey: null,
        createdAt: T1,
      },
      {
        id: 'm2',
        content: 'sent two',
        direction: 'sent',
        conversationId: 'c1',
        mediaType: 'video',
        mediaUrl: 'https://v',
        media: { url: 'x' },
        voiceNote: 'note',
        senderPublicKey: 'pk',
        createdAt: T2,
      },
      {
        id: 'm3',
        content: 'received one',
        direction: 'received',
        conversationId: 'c1',
        senderId: 'peer',
        mediaType: 'text',
        mediaUrl: null,
        media: null,
        voiceNote: null,
        senderPublicKey: null,
        createdAt: T1,
      },
    ]);
    expect(repos.messages.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(result.conversations).toEqual([
      {
        id: 'c1',
        type: ConversationType.ONE_TO_ONE,
        name: null,
        isEncrypted: true,
        otherParticipant: { userId: 'peer', username: 'pal' },
      },
      {
        id: 'c2',
        type: ConversationType.GROUP,
        name: 'Squad',
        isEncrypted: false,
        otherParticipant: null,
      },
    ]);
    expect(result.verification).toEqual([
      {
        id: 'v1',
        workflow: 'personal',
        category: 'id',
        organizationName: null,
        documentType: null,
        justification: 'j',
        links: ['https://l'],
        status: 'pending',
        reviewNote: null,
        createdAt: T1,
        updatedAt: T2,
      },
    ]);
    expect(result.linkedAccounts).toEqual([
      {
        id: 'ca1',
        platform: 'google',
        platformUsername: 'ada',
        platformUserId: '1',
        isActive: true,
        createdAt: T1,
      },
    ]);
    expect(result.articles).toEqual([
      { id: 'a1', title: 'Article', content: 'words', publishedAt: T1 },
    ]);
    expect(result.podcasts).toEqual([
      { id: 'po1', title: 'Podcast', description: 'talk', audioUrl: 'a.mp3', createdAt: T1 },
    ]);
    expect(result.courses).toEqual([
      { id: 'co1', title: 'Course', description: 'learn', createdAt: T1 },
    ]);
    expect(result.enrollments).toEqual([
      { courseId: 'co1', progress: 60, isCompleted: false, enrolledAt: T1 },
    ]);
    expect(result.groupMemberships).toEqual([
      { groupId: 'g1', groupName: 'Gardening', role: 'owner' },
    ]);
    expect(result.notifications).toEqual([
      { id: 'n1', type: 'like', data: { postId: 'p1' }, read: false, createdAt: T1 },
    ]);
    expect(result.orders).toEqual([
      { id: 'o1', total: 42, status: 'paid', itemCount: 2, createdAt: T1 },
    ]);
    expect(result.wallet).toEqual([
      {
        id: 'l1',
        type: 'earning',
        amount: 5,
        balanceAfter: 10,
        currency: 'usd',
        reference: 'ref',
        purpose: 'payout',
        createdAt: T1,
      },
    ]);
    expect(result.settings).toStrictEqual({
      postVisibility: 'public',
      commentPrivacy: 'mutual',
      messagePrivacy: 'everyone',
      profileTheme: 'dark',
      profileThemeColor: '#112233',
      notificationSettings: { likes: true },
      followedHashtags: ['ai'],
      blockedKeywords: ['spam'],
      blockedHashtags: ['bad'],
      blockedContentTypes: ['nsfw'],
      closeFriends: ['buddy'],
    });
    expect(result.personalization).toEqual({
      accountPreferences: { theme: 'dark' },
      privacy: {
        personalization: true,
        adPersonalization: false,
        personalizationControls: { feedPersonalization: true },
      },
    });
    expect(result.analytics).toEqual({
      posts: { count: 4, comments: 3, reactions: 1 },
      audience: { following: 1, followers: 1 },
      content: { stories: 2, articles: 1, podcasts: 1, courses: 1 },
      messaging: { messages: 3, conversations: 2 },
      commerce: { orders: 1, walletEntries: 1 },
    });
    expect(result.exportManifest).toEqual({
      enabledCategories: [
        'profile',
        'posts',
        'messages',
        'personalization',
        'analytics',
        'connected_services',
        'settings',
      ],
      omittedCategories: [],
    });
  });
});

describe('ExportService.exportAsJson', () => {
  it('round-trips the export through pretty-printed JSON', async () => {
    const { service } = buildService({
      users: { findOne: jest.fn().mockResolvedValue(fullUser()) },
      ...fullRepositories(),
    });

    const json = await service.exportAsJson('user-1');

    expect(json.startsWith('{\n  "user"')).toBe(true);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.posts).toHaveLength(4);
    expect(parsed.reels).toHaveLength(2);
    expect(parsed.exportManifest.omittedCategories).toEqual([]);
  });
});

describe('ExportService.importFromJson', () => {
  it.each([null, undefined])(
    'imports when accountDataPermissions is %p and the payload has no follows array',
    async (permissions) => {
      const { transaction, saves } = buildImportManager({
        user: {
          id: 'user-1',
          username: 'me',
          displayName: 'Original',
          accountDataPermissions: permissions,
        },
      });
      const { service } = buildService({ posts: { manager: { transaction } } });

      const summary = await service.importFromJson('user-1', {
        version: '2.1.0',
        user: { displayName: 'Defaulted Name' },
        posts: [{ id: 'p1', content: 'kept' }],
      } as any);

      expect(summary).toEqual(
        expect.objectContaining({ imported: true, posts: 1, follows: 0, walletEntries: 0 })
      );
      expect(saves.find((entry) => entry.entity === 'User')?.value.displayName).toBe(
        'Defaulted Name'
      );
      expect(saves.filter((entry) => entry.entity === 'Post')).toHaveLength(1);
    }
  );

  const fullPayload = (): any => ({
    version: '2.1.0',
    user: {
      displayName: 'Imported Name',
      bio: 'imported bio',
      pronouns: 'they/them',
      avatar: 'new.png',
      header: 'new-header.png',
      accountType: 'creator',
    },
    settings: {
      postVisibility: 'public',
      commentPrivacy: 'mutual',
      messagePrivacy: 'everyone',
      profileTheme: 'dark',
      profileThemeColor: '#222222',
      notificationSettings: { likes: true },
      followedHashtags: ['ai'],
      blockedKeywords: ['k'],
      blockedHashtags: ['h'],
      blockedContentTypes: ['nsfw'],
    },
    posts: [
      {
        id: 'src-p1',
        content: 'Post 1',
        postType: 'feed',
        visibility: 'public',
        media: [{ url: 'u1' }, { url: 'u2', type: 'video', sortOrder: 5, altText: 'x' }],
      },
      { id: 'src-p2', content: 'Reel', isReel: true },
      { id: 'src-p3' },
      { content: 'no id' },
    ],
    comments: [
      { postId: 'src-p1', content: 'nice', sentiment: 'positive' },
      { postId: 'ghost', content: 'x' },
      { postId: 'src-p1', content: '' },
      { content: 'no post' },
    ],
    reactions: [
      { postId: 'src-p1', reaction: 'like' },
      { postId: 'ghost', reaction: 'like' },
      { postId: 'src-p1', reaction: '' },
    ],
    bookmarks: [{ postId: 'src-p1' }, { postId: 'ghost' }],
    stories: [
      {
        textContent: 's1',
        mediaUrl: 'm1',
        audience: 'public',
        expiresAt: '2026-02-01T00:00:00.000Z',
        backgroundOptions: { color: 'red' },
        arFilterName: 'neon',
        music: 'song.mp3',
      },
      { textContent: 's2' },
    ],
    articles: [
      { id: 'a1', title: 'Hello World', content: 'body', publishedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'a2', title: 'Second One', content: 'body2' },
      { id: 'punct', title: '!!!', content: 'c' },
      { title: 'No Id Article', content: 'c' },
      { title: '', content: 'x' },
      { title: 'T', content: '' },
    ],
    podcasts: [
      {
        id: 'po1',
        title: 'Cast One',
        description: 'd1',
        audioUrl: 'a1',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      { id: 'po2', title: 'Cast Two', description: 'd2' },
      { title: 'No Description' },
    ],
    courses: [
      { id: 'co1', title: 'Course One', description: 'd1', createdAt: '2026-02-01T00:00:00.000Z' },
      { id: 'co2', title: 'Course Two', description: 'd2' },
      { title: 'No Description' },
    ],
    enrollments: [
      { courseId: 'co1', progress: 42, isCompleted: true, enrolledAt: '2026-02-01T00:00:00.000Z' },
      { courseId: 'co2' },
      { courseId: 'ghost' },
    ],
    follows: {
      following: [
        { username: 'target' },
        { username: 'me' },
        { username: 'existing' },
        { username: '' },
      ],
      followers: [],
    },
    conversations: [
      { id: 'conv-1', type: ConversationType.ONE_TO_ONE, otherParticipant: { username: 'peer' } },
      { id: 'conv-2', type: ConversationType.GROUP },
      { id: 'conv-3', type: ConversationType.ONE_TO_ONE, otherParticipant: { username: 'ghost' } },
      { id: 'conv-4', type: ConversationType.ONE_TO_ONE, otherParticipant: { username: 'peer2' } },
      { id: 'conv-5', type: ConversationType.ONE_TO_ONE, otherParticipant: { username: 'peer' } },
    ],
    messages: [
      {
        conversationId: 'conv-1',
        direction: 'sent',
        content: 'hello',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      {
        conversationId: 'conv-1',
        direction: 'received',
        content: 'hey',
        senderPublicKey: 'pk',
        mediaType: 'text',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      { conversationId: 'conv-1', direction: 'sent' },
      { conversationId: 'conv-orphan', direction: 'sent', content: 'orphan' },
    ],
    wallet: [
      {
        type: 'earning',
        amount: 5,
        balanceAfter: 10,
        currency: 'usd',
        reference: 'r',
        purpose: 'p',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      { amount: 7 },
    ],
    orders: [{ total: 9, status: 'paid', createdAt: '2026-02-01T00:00:00.000Z' }, {}],
    verification: [
      {
        workflow: 'creator',
        category: 'id',
        organizationName: 'Org',
        documentType: 'passport',
        justification: 'j',
        links: ['https://x'],
        status: 'pending',
        reviewNote: 'n',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-02T00:00:00.000Z',
      },
      {},
    ],
    linkedAccounts: [
      {
        platform: 'google',
        platformUsername: 'g',
        platformUserId: '1',
        isActive: true,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      { platform: '', platformUsername: 'empty' },
      { platformUsername: 'missing-platform' },
    ],
  });

  it('restores every importable category and reports skip counts', async () => {
    const { transaction, saves } = buildImportManager({
      user: {
        id: 'user-1',
        username: 'me',
        displayName: 'Original',
        postVisibility: 'private',
        publicKey: 'my-public-key',
        accountDataPermissions: [
          'profile',
          'posts',
          'messages',
          'personalization',
          'analytics',
          'connected_services',
          'settings',
        ],
      },
      peers: {
        peer: { id: 'peer-id', username: 'peer', publicKey: 'peer-public-key' },
        peer2: { id: 'peer2-id', username: 'peer2', publicKey: 'peer2-public-key' },
      },
      targets: [
        { id: 'u-target', username: 'target' },
        { id: 'user-1', username: 'me' },
        { id: 'u-exist', username: 'existing' },
      ],
      existingFollows: [{ followerId: 'user-1', followingId: 'u-exist' }],
      existingConversations: [
        { id: 'existing-1', participants: [{ id: 'user-1' }, { id: 'peer2-id' }] },
      ],
    });
    const { service } = buildService({ posts: { manager: { transaction } } });

    const summary = await service.importFromJson('user-1', fullPayload());

    expect(summary).toEqual({
      imported: true,
      posts: 3,
      comments: 1,
      reactions: 1,
      bookmarks: 1,
      stories: 2,
      follows: 1,
      articles: 4,
      podcasts: 2,
      courses: 2,
      enrollments: 2,
      messages: 3,
      skippedMessages: 1,
      conversations: 3,
      skippedConversations: 2,
      orders: 2,
      walletEntries: 2,
      verificationRequests: 2,
      linkedAccounts: 1,
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(saves.find((entry) => entry.entity === 'User')?.value).toEqual(
      expect.objectContaining({
        displayName: 'Imported Name',
        bio: 'imported bio',
        accountType: 'creator',
        postVisibility: 'public',
        profileTheme: 'dark',
      })
    );
    expect(saves.filter((entry) => entry.entity === 'Post')).toHaveLength(3);
    expect(saves.filter((entry) => entry.entity === 'Comment')).toHaveLength(1);
    expect(saves.filter((entry) => entry.entity === 'PostReaction')).toHaveLength(1);
    expect(saves.filter((entry) => entry.entity === 'Bookmark')).toHaveLength(1);
    expect(saves.filter((entry) => entry.entity === 'Story')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'Article')).toHaveLength(4);
    expect(saves.filter((entry) => entry.entity === 'Podcast')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'Course')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'CourseEnrollment')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'Follow')).toHaveLength(1);
    expect(saves.filter((entry) => entry.entity === 'Conversation')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'Message')).toHaveLength(3);
    expect(saves.filter((entry) => entry.entity === 'LedgerEntry')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'Order')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'VerificationRequest')).toHaveLength(2);
    expect(saves.filter((entry) => entry.entity === 'ConnectedAccount')).toHaveLength(1);
    expect(saves.find((entry) => entry.entity === 'Conversation')?.value).toEqual(
      expect.objectContaining({ type: ConversationType.ONE_TO_ONE, isEncrypted: true })
    );
    expect(saves.find((entry) => entry.entity === 'Article')?.value.slug).toBe('hello-world-a1');
    expect(saves.filter((entry) => entry.entity === 'Article')[2].value.slug).toBe(
      'untitled-punct'
    );
    expect(saves.find((entry) => entry.entity === 'LedgerEntry')?.value.metadata).toEqual(
      expect.objectContaining({ imported: true })
    );
  });

  it('only imports categories the account has granted', async () => {
    const { transaction, saves } = buildImportManager({
      user: {
        id: 'user-1',
        username: 'me',
        displayName: 'Original',
        postVisibility: 'private',
        accountDataPermissions: ['posts'],
      },
      peers: { target: { id: 'u-target', username: 'target' } },
      targets: [{ id: 'u-target', username: 'target' }],
    });
    const { service } = buildService({ posts: { manager: { transaction } } });

    const summary = await service.importFromJson('user-1', {
      version: '2.1.0',
      user: { displayName: 'Changed' },
      settings: { postVisibility: 'public' },
      follows: { following: [{ username: 'target' }], followers: [] },
      posts: [{ id: 'p1', content: 'kept' }],
      wallet: [{ amount: 1 }],
      orders: [{ total: 1 }],
      verification: [{ workflow: 'personal' }],
      linkedAccounts: [{ platform: 'google' }],
      conversations: [
        { id: 'c1', type: ConversationType.ONE_TO_ONE, otherParticipant: { username: 'target' } },
      ],
      messages: [{ conversationId: 'c1', content: 'hi' }],
    } as any);

    expect(summary).toEqual({
      imported: true,
      posts: 1,
      comments: 0,
      reactions: 0,
      bookmarks: 0,
      stories: 0,
      follows: 0,
      articles: 0,
      podcasts: 0,
      courses: 0,
      enrollments: 0,
      messages: 0,
      skippedMessages: 0,
      conversations: 0,
      skippedConversations: 0,
      orders: 0,
      walletEntries: 0,
      verificationRequests: 0,
      linkedAccounts: 0,
    });
    const savedEntities = saves.map((entry) => entry.entity);
    expect(savedEntities).toEqual(['User', 'Post']);
    expect(saves.find((entry) => entry.entity === 'User')?.value).toEqual(
      expect.objectContaining({ displayName: 'Original', postVisibility: 'private' })
    );
  });

  it('throws NotFoundException when the importing account no longer exists', async () => {
    const { transaction } = buildImportManager({ user: null });
    const { service } = buildService({ posts: { manager: { transaction } } });

    await expect(service.importFromJson('user-1', { user: {} } as any)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a null payload', null],
    ['a string payload', 'not-an-object'],
    ['an array payload', []],
    ['a payload without a user object', {}],
    ['a non-object user', { user: 'nope' }],
    ['an array user', { user: [] }],
  ])('rejects %s', async (_label, payload) => {
    const { service } = buildService();

    await expect(service.importFromJson('user-1', payload as any)).rejects.toThrow(
      'Invalid export data: missing user object'
    );
  });

  it('rejects an export payload from another major version', async () => {
    const { service } = buildService();

    await expect(
      service.importFromJson('user-1', { user: {}, version: '1.0' } as any)
    ).rejects.toThrow('Unsupported export version. Expected version 2.x.');
  });

  it.each([
    ['posts', 'nope'],
    ['messages', 42],
  ])('rejects a payload whose %s collection is not an array', async (collection, value) => {
    const { service } = buildService();

    await expect(
      service.importFromJson('user-1', { user: {}, [collection]: value } as any)
    ).rejects.toThrow(`Invalid export data: ${collection} must be an array`);
  });

  it('rejects a posts collection beyond the 10k item cap', async () => {
    const { service } = buildService();
    const posts = Array.from({ length: 10001 }, (_unused, index) => ({ id: `p${index}` }));

    await expect(service.importFromJson('user-1', { user: {}, posts } as any)).rejects.toThrow(
      'Invalid export data: posts exceeds the 10000 item limit'
    );
  });

  it('rejects a messages collection beyond the 100k item cap', async () => {
    const { service } = buildService();
    const messages = Array.from({ length: 100001 }, (_unused, index) => ({ id: `m${index}` }));

    await expect(service.importFromJson('user-1', { user: {}, messages } as any)).rejects.toThrow(
      'Invalid export data: messages exceeds the 100000 item limit'
    );
  });

  it.each([
    ['a non-object follows payload', 'nope'],
    ['a non-array following list', { following: 'nope', followers: [] }],
    ['a non-array followers list', { following: [], followers: 'nope' }],
  ])('rejects %s', async (_label, follows) => {
    const { service } = buildService();

    await expect(service.importFromJson('user-1', { user: {}, follows } as any)).rejects.toThrow(
      'Invalid export data: follows must contain following and followers arrays'
    );
  });
});

describe('ExportService.getExportInfo', () => {
  it('reports an export that has never run', async () => {
    const { service, repos } = buildService({
      dataExports: { findOne: jest.fn().mockResolvedValue(null) },
    });

    const info = await service.getExportInfo('user-1');

    expect(info).toEqual({
      userId: 'user-1',
      dataTypes: expect.arrayContaining(['profile', 'posts', 'messages', 'settings']),
      estimatedSize: 'Unknown',
      lastExport: null,
      canExport: true,
    });
    expect(repos.dataExports.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-1' } },
      order: { createdAt: 'DESC' },
    });
  });

  it('reports the most recent export timestamp', async () => {
    const { service } = buildService({
      dataExports: { findOne: jest.fn().mockResolvedValue({ createdAt: T1 }) },
    });

    const info = await service.getExportInfo('user-1');

    expect(info.lastExport).toBe(T1.toISOString());
    expect(info.dataTypes).toHaveLength(21);
  });
});

describe('ExportService.deleteAllUserData', () => {
  it('throws NotFoundException when the account no longer exists', async () => {
    const { service } = buildService();

    await expect(service.deleteAllUserData('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('removes owned rows, anonymizes the account, and skips empty collections', async () => {
    const { service, repos } = buildService({
      users: {
        findOne: jest.fn().mockResolvedValue({
          id: 'abcdef123456',
          username: 'ada',
          email: 'ada@example.com',
          bio: 'builder',
          avatar: 'a.png',
        }),
      },
      comments: { find: jest.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]) },
      messages: { find: jest.fn().mockResolvedValue([{ id: 'm1' }]) },
      posts: { find: jest.fn().mockResolvedValue([{ id: 'p1' }]) },
      follows: { find: jest.fn().mockResolvedValue([{ id: 'f1' }, { id: 'f2' }]) },
    });

    const result = await service.deleteAllUserData('abcdef123456');

    expect(result).toEqual({
      success: true,
      deletedCounts: {
        comments: 2,
        reactions: 0,
        bookmarks: 0,
        stories: 0,
        groupMemberships: 0,
        notifications: 0,
        messages: 1,
        orders: 0,
        wallet: 0,
        articles: 0,
        podcasts: 0,
        enrollments: 0,
        posts: 1,
        follows: 2,
      },
    });
    expect(repos.comments.remove).toHaveBeenCalledWith([{ id: 'c1' }, { id: 'c2' }]);
    expect(repos.messages.remove).toHaveBeenCalledWith([{ id: 'm1' }]);
    expect(repos.reactions.remove).not.toHaveBeenCalled();
    expect(repos.bookmarks.remove).not.toHaveBeenCalled();
    expect(repos.follows.remove).toHaveBeenCalledWith([{ id: 'f1' }, { id: 'f2' }]);
    expect(repos.users.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        username: 'deleted_abcdef12',
        email: 'deleted_abcdef12@zynkra.deleted',
        bio: null,
        avatar: null,
      })
    );
  });
});
