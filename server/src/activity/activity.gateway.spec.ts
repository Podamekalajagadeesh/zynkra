import { ActivityGateway } from './activity.gateway';

describe('ActivityGateway', () => {
  const user = {
    id: 'user-1',
    isOnline: false,
    lastSeenAt: null,
    showOnlineStatus: true,
    showLastSeenTimestamp: true,
    activityVisibility: 'public',
  } as any;

  const createGateway = () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(user),
    };
    const visibilityService = {
      canViewActivity: jest.fn().mockResolvedValue(true),
    };
    const gateway = new ActivityGateway(repository as any, {} as any, visibilityService as any);
    gateway.server = {
      fetchSockets: jest.fn().mockResolvedValue([]),
    } as any;
    return { gateway, repository };
  };

  it('keeps a user online until the last device disconnects', async () => {
    const { gateway, repository } = createGateway();
    const firstClient = { id: 'socket-1', data: { userId: 'user-1' } } as any;
    const secondClient = { id: 'socket-2', data: { userId: 'user-1' } } as any;

    await gateway.handleUserOnline(firstClient);
    await gateway.handleUserOnline(secondClient);
    repository.save.mockClear();

    await gateway.handleDisconnect(firstClient);

    expect(repository.save).not.toHaveBeenCalled();
    expect((gateway as any).activeUsers.get('user-1')).toEqual(new Set(['socket-2']));

    await gateway.handleDisconnect(secondClient);

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-1',
      isOnline: false,
    }));
    expect((gateway as any).activeUsers.has('user-1')).toBe(false);
  });
});