import { UnauthorizedException } from '@nestjs/common';
import { FeedController } from './feed.controller';

describe('FeedController viewer hydration', () => {
  let controller: FeedController;
  let feedService: any;
  let usersService: any;

  beforeEach(() => {
    feedService = {
      getChronologicalFeed: jest.fn().mockResolvedValue([]),
      getFeed: jest.fn().mockResolvedValue([]),
      getSubscriptionsFeed: jest.fn().mockResolvedValue([]),
    };
    usersService = {
      findOneById: jest.fn().mockResolvedValue({ id: 'user-1', username: 'viewer' }),
    };
    controller = new FeedController(feedService, usersService);
  });

  it('hydrates the authenticated JWT payload before calling the feed service', async () => {
    await controller.getChronologicalFeed({ user: { userId: 'user-1' } });

    expect(usersService.findOneById).toHaveBeenCalledWith('user-1');
    expect(feedService.getChronologicalFeed).toHaveBeenCalledWith({
      id: 'user-1',
      username: 'viewer',
    });
  });

  it('preserves anonymous feed access with a null viewer', async () => {
    await controller.getChronologicalFeed({ user: undefined });

    expect(usersService.findOneById).not.toHaveBeenCalled();
    expect(feedService.getChronologicalFeed).toHaveBeenCalledWith(null);
  });

  it('rejects a token whose account no longer exists', async () => {
    usersService.findOneById.mockResolvedValue(null);

    await expect(controller.getChronologicalFeed({ user: { userId: 'missing' } })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('passes the hydrated viewer and view options to the root feed', async () => {
    await controller.getFeed({ user: { userId: 'user-1' } }, 'following', 5);

    expect(feedService.getFeed).toHaveBeenCalledWith(
      { id: 'user-1', username: 'viewer' },
      { view: 'following', limit: 5 },
    );
  });

  it('loads subscription relations for the subscriptions feed', async () => {
    await controller.getSubscriptionsFeed({ user: { userId: 'user-1' } });

    expect(usersService.findOneById).toHaveBeenCalledWith('user-1', [
      'subscriptions',
      'subscriptions.creator',
    ]);
    expect(feedService.getSubscriptionsFeed).toHaveBeenCalledWith({
      id: 'user-1',
      username: 'viewer',
    });
  });
});
