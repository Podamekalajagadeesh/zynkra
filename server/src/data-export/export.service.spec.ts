import { ExportService } from './export.service';

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
    ];
    const service = Reflect.construct(ExportService, repositories) as ExportService;

    const restricted = await service.exportUserData('user-2');

    expect(restricted.personalization).toEqual({});
    expect(restricted.analytics).toEqual({});
    expect(restricted.exportManifest.omittedCategories).toEqual(expect.arrayContaining(['personalization', 'analytics']));
  });
});