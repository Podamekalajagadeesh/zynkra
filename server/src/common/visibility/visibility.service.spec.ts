import { VisibilityService } from './visibility.service';
import { ProfilePrivacy } from '../../users/entities/user.entity';
import { PostVisibility } from '../../posts/entities/post.entity';

describe('VisibilityService', () => {
  let query: jest.Mock;
  let service: VisibilityService;

  beforeEach(() => {
    query = jest.fn();
    service = new VisibilityService({ query } as never);
  });

  describe('getBlockedIdSet', () => {
    it('unions both directions of a block into one set', async () => {
      query.mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);
      const blocked = await service.getBlockedIdSet('u1');
      expect(blocked).toEqual(new Set(['b1', 'b2']));
      expect(query.mock.calls[0][1]).toEqual(['u1']);
    });
  });

  describe('isBlockedEither', () => {
    it('short-circuits to false for empty or identical ids without querying', async () => {
      await expect(service.isBlockedEither('', 'b')).resolves.toBe(false);
      await expect(service.isBlockedEither('a', '')).resolves.toBe(false);
      await expect(service.isBlockedEither('a', 'a')).resolves.toBe(false);
      expect(query).not.toHaveBeenCalled();
    });

    it('reports a block in either direction as blocked', async () => {
      query.mockResolvedValue([{ exists: true }]);
      await expect(service.isBlockedEither('a', 'b')).resolves.toBe(true);
    });

    it('reports no block when the lookup comes back empty', async () => {
      query.mockResolvedValue([{ exists: false }]);
      await expect(service.isBlockedEither('a', 'b')).resolves.toBe(false);
      query.mockResolvedValue([]);
      await expect(service.isBlockedEither('a', 'b')).resolves.toBe(false);
    });
  });

  describe('isFollowing', () => {
    it('treats self-follows as true and empty ids as false without querying', async () => {
      await expect(service.isFollowing('a', 'a')).resolves.toBe(true);
      await expect(service.isFollowing('', 'b')).resolves.toBe(false);
      await expect(service.isFollowing('a', '')).resolves.toBe(false);
      expect(query).not.toHaveBeenCalled();
    });

    it('reads the follows table for accepted follows only', async () => {
      query.mockResolvedValue([{ exists: true }]);
      await expect(service.isFollowing('viewer', 'author')).resolves.toBe(true);
      expect(query.mock.calls[0][1]).toEqual(['viewer', 'author']);
      query.mockResolvedValue([{ exists: false }]);
      await expect(service.isFollowing('viewer', 'author')).resolves.toBe(false);
    });
  });

  describe('getHiddenPrivateAuthorIds', () => {
    it('returns an empty set without querying when there are no candidates', async () => {
      await expect(service.getHiddenPrivateAuthorIds('viewer', [])).resolves.toEqual(new Set());
      await expect(service.getHiddenPrivateAuthorIds('viewer', ['', ''])).resolves.toEqual(
        new Set()
      );
      expect(query).not.toHaveBeenCalled();
    });

    it('dedupes candidates and hides private authors the viewer neither owns nor follows', async () => {
      query.mockResolvedValue([{ id: 'p1' }]);
      const hidden = await service.getHiddenPrivateAuthorIds('viewer', ['p1', 'p1', 'p2', '']);
      expect(hidden).toEqual(new Set(['p1']));
      const params = query.mock.calls[0][1];
      expect(params).toEqual([['p1', 'p2'], ProfilePrivacy.PRIVATE, 'viewer']);
    });

    it('still hides private authors from anonymous viewers', async () => {
      query.mockResolvedValue([{ id: 'p1' }]);
      const hidden = await service.getHiddenPrivateAuthorIds(null, ['p1']);
      expect(hidden).toEqual(new Set(['p1']));
      expect(query.mock.calls[0][1][2]).toBeNull();
    });
  });

  describe('canViewAuthor', () => {
    it('always lets an owner see their own profile', async () => {
      await expect(service.canViewAuthor('u1', 'u1')).resolves.toBe(true);
      expect(query).not.toHaveBeenCalled();
    });

    it('refuses when either side has blocked the other', async () => {
      query.mockResolvedValue([{ exists: true }]);
      await expect(service.canViewAuthor('viewer', 'author')).resolves.toBe(false);
    });

    it('refuses private accounts the viewer does not follow', async () => {
      query.mockResolvedValueOnce([{ exists: false }]).mockResolvedValueOnce([{ id: 'author' }]);
      await expect(service.canViewAuthor('viewer', 'author')).resolves.toBe(false);
    });

    it('allows public accounts and followed private accounts', async () => {
      query.mockResolvedValueOnce([{ exists: false }]).mockResolvedValueOnce([]);
      await expect(service.canViewAuthor('viewer', 'author')).resolves.toBe(true);
    });
  });

  describe('canViewActivity', () => {
    const target = { id: 'author', activityVisibility: 'public' as const };

    it('lets the owner see their own activity without querying', async () => {
      await expect(service.canViewActivity('author', { ...target })).resolves.toBe(true);
      expect(query).not.toHaveBeenCalled();
    });

    it('refuses anonymous viewers', async () => {
      await expect(service.canViewActivity(null, { ...target })).resolves.toBe(false);
    });

    it('refuses when either side has blocked the other', async () => {
      query.mockResolvedValue([{ exists: true }]);
      await expect(service.canViewActivity('viewer', { ...target })).resolves.toBe(false);
    });

    it('refuses private activity', async () => {
      query.mockResolvedValue([{ exists: false }]);
      await expect(
        service.canViewActivity('viewer', { ...target, activityVisibility: 'private' })
      ).resolves.toBe(false);
    });

    it('allows public activity for non-blocked viewers', async () => {
      query.mockResolvedValue([{ exists: false }]);
      await expect(service.canViewActivity('viewer', { ...target })).resolves.toBe(true);
    });

    it('restricts friends-only activity to mutual follows', async () => {
      query
        .mockResolvedValueOnce([{ exists: false }]) // block check
        .mockResolvedValueOnce([{ exists: true }]) // viewer → target
        .mockResolvedValueOnce([{ exists: true }]); // target → viewer
      await expect(
        service.canViewActivity('viewer', { ...target, activityVisibility: 'friends' })
      ).resolves.toBe(true);

      query
        .mockResolvedValueOnce([{ exists: false }]) // block check
        .mockResolvedValueOnce([{ exists: true }]) // viewer → target
        .mockResolvedValueOnce([{ exists: false }]); // target ↛ viewer
      await expect(
        service.canViewActivity('viewer', { ...target, activityVisibility: 'friends' })
      ).resolves.toBe(false);
    });
  });

  describe('filterVisiblePostsForViewer', () => {
    it('drops posts without an author id', async () => {
      const out = await service.filterVisiblePostsForViewer('viewer', [
        { visibility: PostVisibility.PUBLIC },
      ]);
      expect(out).toEqual([]);
    });

    it('drops posts from blocked authors', async () => {
      query.mockResolvedValue([{ exists: true }]);
      const post = { visibility: PostVisibility.PUBLIC, user: { id: 'author' } };
      await expect(service.filterVisiblePostsForViewer('viewer', [post])).resolves.toEqual([]);
    });

    it('keeps an owner’s own non-public posts', async () => {
      query.mockResolvedValue([{ exists: false }]);
      const post = { visibility: PostVisibility.ONLY_ME, user: { id: 'viewer' } };
      await expect(service.filterVisiblePostsForViewer('viewer', [post])).resolves.toEqual([post]);
    });

    it('keeps public posts from unblocked authors', async () => {
      query.mockResolvedValue([{ exists: false }]);
      const post = { visibility: PostVisibility.PUBLIC, user: { id: 'author' } };
      await expect(service.filterVisiblePostsForViewer('viewer', [post])).resolves.toEqual([post]);
    });

    it('requires mutual follows for friends-only posts', async () => {
      const post = { visibility: PostVisibility.FRIENDS, user: { id: 'author' } };
      // Queries in order: loop block check, canViewAuthor block check,
      // hidden-private lookup, viewer→author follow, author→viewer follow.
      query
        .mockResolvedValueOnce([{ exists: false }])
        .mockResolvedValueOnce([{ exists: false }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ exists: true }]);
      await expect(service.filterVisiblePostsForViewer('viewer', [post])).resolves.toEqual([post]);

      query
        .mockResolvedValueOnce([{ exists: false }])
        .mockResolvedValueOnce([{ exists: false }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ exists: false }]);
      await expect(service.filterVisiblePostsForViewer('viewer', [post])).resolves.toEqual([]);
    });

    it('never shows non-public posts to anonymous viewers', async () => {
      const post = { visibility: PostVisibility.FRIENDS, user: { id: 'author' } };
      query.mockResolvedValueOnce([]); // hidden-private lookup only
      await expect(service.filterVisiblePostsForViewer(null, [post])).resolves.toEqual([]);
    });
  });

  describe('filterVisiblePosts', () => {
    it('returns the input array untouched when it is empty', async () => {
      const input: unknown[] = [];
      await expect(service.filterVisiblePosts('viewer', input)).resolves.toBe(input);
      expect(query).not.toHaveBeenCalled();
    });

    it('drops blocked and hidden-private authors, keeps the rest', async () => {
      query
        .mockResolvedValueOnce([{ id: 'blocked' }])
        .mockResolvedValueOnce([{ id: 'private-author' }]);
      const posts = [
        { user: { id: 'blocked' } },
        { user: { id: 'private-author' } },
        { user: { id: 'public-author' } },
        { user: { id: undefined } },
      ];
      const out = await service.filterVisiblePosts('viewer', posts);
      expect(out.map((p) => (p as { user: { id?: string } }).user.id)).toEqual([
        'public-author',
        undefined,
      ]);
    });

    it('returns the same array when nothing is filtered', async () => {
      query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const posts = [{ user: { id: 'public-author' } }];
      await expect(service.filterVisiblePosts('viewer', posts)).resolves.toBe(posts);
    });

    it('skips the block lookup for anonymous viewers', async () => {
      query.mockResolvedValueOnce([]);
      const posts = [{ user: { id: 'author' } }];
      await expect(service.filterVisiblePosts(null, posts)).resolves.toBe(posts);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
