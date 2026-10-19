import { NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import { ConversationType } from '../dms/conversation-type.enum';

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
    const service = Reflect.construct(ExportService, repositories) as ExportService;

    const permitted = await service.exportUserData('user-1');

    expect(permitted.personalization).toEqual({
      accountPreferences: { theme: 'dark', language: 'en' },
      privacy: {
        personalization: true,
        adPersonalization: false,
        personalizationControls: { feedPersonalization: false },
      },
    });
    expect(permitted.analytics).toEqual(expect.objectContaining({
      posts: { count: 0, comments: 0, reactions: 0 },
      audience: { following: 0, followers: 0 },
    }));
    expect(permitted.exportManifest.enabledCategories).toEqual(['profile', 'personalization', 'analytics']);
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
    const service = Reflect.construct(ExportService, repositories) as ExportService;

    const restricted = await service.exportUserData('user-2');

    expect(restricted.personalization).toEqual({});
    expect(restricted.analytics).toEqual({});
    expect(restricted.exportManifest.omittedCategories).toEqual(expect.arrayContaining(['personalization', 'analytics']));
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
        .mockImplementation((...args: any[]) => Promise.resolve(args.length > 1 ? args[1] : args[0])),
      create: jest.fn().mockImplementation((_entity: any, value: any) => value),
      createQueryBuilder: jest.fn(),
      ...overrides[key],
    };
    repos[key] = repository;
    return repository;
  });
  return { service: Reflect.construct(ExportService, ordered) as ExportService, repos };
};

const buildImportManager = (
  options: {
    user?: any;
    peers?: Record<string, any>;
    targets?: any[];
    existingFollows?: any[];
    existingConversations?: any[];
  } = {},
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
        expect.objectContaining({ imported: true, posts: 1, follows: 0, walletEntries: 0 }),
      );
      expect(saves.find((entry) => entry.entity === 'User')?.value.displayName).toBe('Defaulted Name');
      expect(saves.filter((entry) => entry.entity === 'Post')).toHaveLength(1);
    },
  );
});