import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  it('hides online and last-seen values when the owner disables them', async () => {
    const user = {
      id: 'target-1',
      isOnline: true,
      lastSeenAt: new Date('2026-01-01T00:00:00.000Z'),
      showOnlineStatus: false,
      showLastSeenTimestamp: false,
      activityVisibility: 'public',
    } as any;
    const repository = {
      find: jest.fn().mockResolvedValue([user]),
    };
    const visibilityService = {
      canViewActivity: jest.fn().mockResolvedValue(true),
    };
    const service = new ActivityService(repository as any, visibilityService as any);

    await expect(service.getUsersStatuses(['target-1'], 'viewer-1')).resolves.toEqual([{
      userId: 'target-1',
      isOnline: undefined,
      lastSeenAt: undefined,
    }]);
  });

  it('returns presence when visibility and owner settings allow it', async () => {
    const lastSeenAt = new Date('2026-01-01T00:00:00.000Z');
    const user = {
      id: 'target-1',
      isOnline: true,
      lastSeenAt,
      showOnlineStatus: true,
      showLastSeenTimestamp: true,
      activityVisibility: 'public',
    } as any;
    const repository = { find: jest.fn().mockResolvedValue([user]) };
    const visibilityService = { canViewActivity: jest.fn().mockResolvedValue(true) };
    const service = new ActivityService(repository as any, visibilityService as any);

    await expect(service.getUsersStatuses(['target-1'], 'viewer-1')).resolves.toEqual([{
      userId: 'target-1',
      isOnline: true,
      lastSeenAt,
    }]);
  });
});