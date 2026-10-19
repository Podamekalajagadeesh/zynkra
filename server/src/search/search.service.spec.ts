import axios from 'axios';
import { Brackets } from 'typeorm';
import { SearchService } from './search.service';

describe('SearchService search visibility', () => {
  it('applies visibility to both username and display-name matches', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      query: jest.fn().mockResolvedValue([]),
    };
    const visibilityService = { filterVisiblePostsForViewer: jest.fn().mockResolvedValue([]) };
    const service = new SearchService(
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      visibilityService as any
    );

    await service.search('alex', 'viewer-id');

    expect(queryBuilder.where).toHaveBeenCalledWith(expect.any(Brackets));
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user."searchVisibility" = \'everyone\''),
      { viewerId: 'viewer-id' }
    );
    expect(queryBuilder.andWhere.mock.invocationCallOrder[0]).toBeGreaterThan(
      queryBuilder.where.mock.invocationCallOrder[0]
    );
  });

  it('uses websearch_to_tsquery for full-text matching', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      query: jest.fn().mockResolvedValue([]),
    };
    const visibilityService = { filterVisiblePostsForViewer: jest.fn().mockResolvedValue([]) };
    const service = new SearchService(
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      repository as any,
      visibilityService as any
    );

    await service.search('hello world', 'viewer-id');

    // First where() is the users FTS Brackets — its SQL must reference searchVector + tsquery.
    const firstWhereArg = queryBuilder.where.mock.calls[0][0];
    expect(firstWhereArg).toBeInstanceOf(Brackets);
    // Brackets wraps a callback; inspect setParameter + orderBy for FTS usage.
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
    expect(queryBuilder.setParameter).toHaveBeenCalledWith('ftsQuery', 'hello world');
  });

  it('rejects empty queries', async () => {
    const service = new SearchService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { filterVisiblePostsForViewer: jest.fn() } as any
    );
    await expect(service.search('   ', 'viewer')).rejects.toThrow('Search query is required');
  });
});

// ---------------------------------------------------------------------------
// Shared harness for the advanced/fallback-path suites below. Every entity gets
// its own repository + query builder so tests can assert per-entity dispatch,
// and TypeORM Brackets callbacks (stored by the constructor, only invoked when
// building real SQL) can be executed directly through executeBrackets().
// ---------------------------------------------------------------------------

const makeQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  setParameter: jest.fn().mockReturnThis(),
});

const makeHarness = () => {
  const qbs: Record<string, any> = {};
  const repos: Record<string, any> = {};
  for (const name of ['users', 'posts', 'tags', 'places', 'groups', 'events', 'products']) {
    qbs[name] = makeQueryBuilder();
    repos[name] = {
      createQueryBuilder: jest.fn().mockReturnValue(qbs[name]),
      query: jest.fn().mockResolvedValue([]),
    };
  }
  const visibilityService = {
    filterVisiblePostsForViewer: jest.fn((_viewerId: string | null, posts: any[]) =>
      Promise.resolve(posts)
    ),
  };
  const service = new SearchService(
    repos.users as any,
    repos.posts as any,
    repos.tags as any,
    repos.places as any,
    repos.groups as any,
    repos.events as any,
    repos.products as any,
    visibilityService as any
  );
  return { service, qbs, repos, visibilityService };
};

const executeBrackets = (queryBuilder: any) => {
  const expression = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
  };
  for (const [condition] of queryBuilder.where.mock.calls) {
    if (condition instanceof Brackets) {
      condition.whereFactory(expression as any);
    }
  }
  return expression;
};

describe('SearchService search fan-out', () => {
  it('queries all seven entity types, trims the query, and enriches hashtag/group counts', async () => {
    const { service, qbs, repos, visibilityService } = makeHarness();
    qbs.users.getMany.mockResolvedValue([{ id: 'u1' }]);
    qbs.posts.getMany.mockResolvedValue([{ id: 'p1' }]);
    qbs.tags.getMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
    qbs.places.getMany.mockResolvedValue([{ id: 'pl1' }]);
    qbs.groups.getMany.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);
    qbs.events.getMany.mockResolvedValue([{ id: 'e1' }]);
    qbs.products.getMany.mockResolvedValue([{ id: 'pr1' }]);
    repos.tags.query.mockResolvedValueOnce([{ count: 42 }]).mockResolvedValueOnce([]);
    repos.groups.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 7 }]);

    const result = await service.search('  alex  ');

    expect(result.users).toEqual([{ id: 'u1' }]);
    expect(result.posts).toEqual([{ id: 'p1' }]);
    expect(result.places).toEqual([{ id: 'pl1' }]);
    expect(result.events).toEqual([{ id: 'e1' }]);
    expect(result.products).toEqual([{ id: 'pr1' }]);
    expect(result.hashtags).toEqual([
      { id: 't1', postCount: 42 },
      { id: 't2', postCount: 0 },
    ]);
    expect(result.groups).toEqual([
      { id: 'g1', memberCount: 0 },
      { id: 'g2', memberCount: 7 },
    ]);
    expect(repos.tags.query).toHaveBeenNthCalledWith(1, expect.stringContaining('post_tags'), [
      't1',
    ]);
    expect(repos.groups.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('group_members'),
      ['g1']
    );

    // normalize() trims before building the FTS/ILIKE parameters
    expect(qbs.users.setParameter).toHaveBeenCalledWith('ftsQuery', 'alex');
    expect(qbs.users.setParameter).toHaveBeenCalledWith('pattern', '%alex%');
    expect(qbs.users.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user."searchVisibility" = \'everyone\''),
      { viewerId: null }
    );
    expect(qbs.users.limit).toHaveBeenCalledWith(20);
    expect(qbs.posts.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, [
      { id: 'p1' },
    ]);

    // Execute the stored Brackets factories — TypeORM only runs them when
    // building SQL, which mocked query builders never do.
    const usersExpr = executeBrackets(qbs.users);
    expect(usersExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('user."searchVector" @@ websearch_to_tsquery')
    );
    expect(usersExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('user.username ILIKE'));
    expect(usersExpr.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('user."displayName" ILIKE')
    );

    const postsExpr = executeBrackets(qbs.posts);
    expect(postsExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('post."searchVector" @@ websearch_to_tsquery')
    );
    expect(postsExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('post.content ILIKE'));

    const tagsExpr = executeBrackets(qbs.tags);
    expect(tagsExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('tag."searchVector" @@ websearch_to_tsquery')
    );
    expect(tagsExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('tag.name ILIKE'));

    const placesExpr = executeBrackets(qbs.places);
    expect(placesExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('place."searchVector" @@ websearch_to_tsquery')
    );
    expect(placesExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('place.name ILIKE'));
    expect(placesExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('place.address ILIKE'));

    const groupsExpr = executeBrackets(qbs.groups);
    expect(groupsExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('group."searchVector" @@ websearch_to_tsquery')
    );
    expect(groupsExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('group.name ILIKE'));

    const eventsExpr = executeBrackets(qbs.events);
    expect(eventsExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('event."searchVector" @@ websearch_to_tsquery')
    );
    expect(eventsExpr.orWhere).toHaveBeenCalledWith(expect.stringContaining('event.title ILIKE'));
    expect(eventsExpr.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('event.description ILIKE')
    );

    const productsExpr = executeBrackets(qbs.products);
    expect(productsExpr.where).toHaveBeenCalledWith(
      expect.stringContaining('product."searchVector" @@ websearch_to_tsquery')
    );
    expect(productsExpr.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('product.name ILIKE')
    );
    expect(productsExpr.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('product.description ILIKE')
    );

    // search() ranks events by ts_rank, unlike advancedSearch's date ordering
    expect(qbs.events.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
  });
});

describe('SearchService advancedSearch dispatch', () => {
  it('routes type=users to the users repository with visibility and pagination', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.users.getMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

    const result: any = await service.advancedSearch({
      query: '  nature ',
      type: 'users',
      limit: 5,
      offset: 10,
      viewerId: 'viewer-1',
    });

    expect(result).toEqual({ users: [{ id: 'u1' }, { id: 'u2' }], total: 2 });
    expect(repos.users.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(repos.posts.createQueryBuilder).not.toHaveBeenCalled();
    expect(repos.events.createQueryBuilder).not.toHaveBeenCalled();
    expect(qbs.users.andWhere).toHaveBeenCalledWith(expect.any(String), {
      viewerId: 'viewer-1',
    });
    expect(qbs.users.limit).toHaveBeenCalledWith(5);
    expect(qbs.users.offset).toHaveBeenCalledWith(10);
    expect(qbs.users.setParameter).toHaveBeenCalledWith('ftsQuery', 'nature');
    expect(qbs.users.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
    const expression = executeBrackets(qbs.users);
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('user.username ILIKE'));
    expect(expression.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('user."displayName" ILIKE')
    );
  });

  it('routes type=posts with popularity ordering and applies visibility filtering', async () => {
    const { service, qbs, repos, visibilityService } = makeHarness();
    qbs.posts.getMany.mockResolvedValue([{ id: 'p1' }]);
    visibilityService.filterVisiblePostsForViewer.mockResolvedValue([
      { id: 'p1', visibility: 'public' },
    ]);

    const result: any = await service.advancedSearch({
      query: 'news',
      type: 'posts',
      sort: 'popularity',
      viewerId: 'viewer-1',
    });

    expect(result).toEqual({ posts: [{ id: 'p1', visibility: 'public' }], total: 1 });
    expect(repos.posts.createQueryBuilder).toHaveBeenCalledWith('post');
    expect(qbs.posts.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(qbs.posts.orderBy).toHaveBeenCalledWith('post."repostCount"', 'DESC');
    expect(qbs.posts.addOrderBy).toHaveBeenCalledWith('post."createdAt"', 'DESC');
    expect(qbs.posts.limit).toHaveBeenCalledWith(20);
    expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith('viewer-1', [
      { id: 'p1' },
    ]);
    const expression = executeBrackets(qbs.posts);
    expect(expression.where).toHaveBeenCalledWith(expect.stringContaining('post."searchVector"'));
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('post.content ILIKE'));
  });

  it('routes type=posts with default relevance ordering', async () => {
    const { service, qbs, visibilityService } = makeHarness();

    const result: any = await service.advancedSearch({ query: 'news', type: 'posts' });

    expect(result).toEqual({ posts: [], total: 0 });
    expect(qbs.posts.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
    expect(qbs.posts.addOrderBy).toHaveBeenCalledWith('post."createdAt"', 'DESC');
    expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, []);
  });

  it('routes type=hashtags and counts posts per tag, defaulting missing counts to zero', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.tags.getMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
    repos.tags.query.mockResolvedValueOnce([{ count: 3 }]).mockResolvedValueOnce([]);

    const result: any = await service.advancedSearch({ query: ' travel ', type: 'hashtags' });

    expect(result).toEqual({
      hashtags: [
        { id: 't1', postCount: 3 },
        { id: 't2', postCount: 0 },
      ],
      total: 2,
    });
    expect(repos.tags.createQueryBuilder).toHaveBeenCalledWith('tag');
    expect(qbs.tags.limit).toHaveBeenCalledWith(20);
    expect(qbs.tags.offset).toHaveBeenCalledWith(0);
    expect(repos.tags.query).toHaveBeenNthCalledWith(2, expect.stringContaining('post_tags'), [
      't2',
    ]);
    const expression = executeBrackets(qbs.tags);
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('tag.name ILIKE'));
  });

  it('routes type=places with name/address fallback matching', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.places.getMany.mockResolvedValue([{ id: 'pl1' }]);

    const result: any = await service.advancedSearch({
      query: 'park',
      type: 'places',
      limit: 3,
      offset: 6,
    });

    expect(result).toEqual({ places: [{ id: 'pl1' }], total: 1 });
    expect(repos.places.createQueryBuilder).toHaveBeenCalledWith('place');
    expect(qbs.places.limit).toHaveBeenCalledWith(3);
    expect(qbs.places.offset).toHaveBeenCalledWith(6);
    const expression = executeBrackets(qbs.places);
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('place.name ILIKE'));
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('place.address ILIKE'));
  });

  it('routes type=groups and counts members, defaulting missing counts to zero', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.groups.getMany.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);
    repos.groups.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 12 }]);

    const result: any = await service.advancedSearch({ query: 'run', type: 'groups' });

    expect(result).toEqual({
      groups: [
        { id: 'g1', memberCount: 0 },
        { id: 'g2', memberCount: 12 },
      ],
      total: 2,
    });
    expect(repos.groups.createQueryBuilder).toHaveBeenCalledWith('group');
    expect(repos.groups.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('group_members'),
      ['g1']
    );
    const expression = executeBrackets(qbs.groups);
    expect(expression.orWhere).toHaveBeenCalledWith(expect.stringContaining('group.name ILIKE'));
  });

  it('routes type=events with date ordering', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.events.getMany.mockResolvedValue([{ id: 'e1' }]);

    const result: any = await service.advancedSearch({ query: 'festival', type: 'events' });

    expect(result).toEqual({ events: [{ id: 'e1' }], total: 1 });
    expect(repos.events.createQueryBuilder).toHaveBeenCalledWith('event');
    expect(qbs.events.orderBy).toHaveBeenCalledWith('event.date', 'ASC');
    expect(qbs.events.limit).toHaveBeenCalledWith(20);
    const expression = executeBrackets(qbs.events);
    expect(expression.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('event.description ILIKE')
    );
  });

  it('routes type=products with name/description fallback matching', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.products.getMany.mockResolvedValue([{ id: 'pr1' }]);

    const result: any = await service.advancedSearch({ query: 'bike', type: 'products' });

    expect(result).toEqual({ products: [{ id: 'pr1' }], total: 1 });
    expect(repos.products.createQueryBuilder).toHaveBeenCalledWith('product');
    expect(qbs.products.addOrderBy).toHaveBeenCalledWith('product."createdAt"', 'DESC');
    const expression = executeBrackets(qbs.products);
    expect(expression.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('product.description ILIKE')
    );
  });

  it('rejects an unknown search type', async () => {
    const { service, repos } = makeHarness();

    await expect(service.advancedSearch({ query: 'x', type: 'memes' as any })).rejects.toThrow(
      'Invalid search type: memes'
    );
    expect(repos.users.createQueryBuilder).not.toHaveBeenCalled();
    expect(repos.posts.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('falls back to the multi-entity search when no type is given', async () => {
    const { service, qbs, repos } = makeHarness();

    const result: any = await service.advancedSearch({ query: 'storms' });

    expect(result).toEqual({
      users: [],
      posts: [],
      hashtags: [],
      places: [],
      groups: [],
      events: [],
      products: [],
    });
    expect(repos.users.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(repos.posts.createQueryBuilder).toHaveBeenCalledWith('post');
    expect(repos.products.createQueryBuilder).toHaveBeenCalledWith('product');
    expect(qbs.users.setParameter).toHaveBeenCalledWith('ftsQuery', 'storms');
  });

  it('rejects an empty query before dispatching', async () => {
    const { service, repos } = makeHarness();

    await expect(service.advancedSearch({ query: '   ', type: 'users' })).rejects.toThrow(
      'Search query is required'
    );
    expect(repos.users.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('private search helpers fall back to limit=20/offset=0 when called without them', async () => {
    const { service, qbs, visibilityService } = makeHarness();

    const users: any = await (service as any).searchUsers('q');
    expect(users).toEqual({ users: [], total: 0 });
    expect(qbs.users.limit).toHaveBeenCalledWith(20);
    expect(qbs.users.offset).toHaveBeenCalledWith(0);
    expect(qbs.users.andWhere).toHaveBeenCalledWith(expect.any(String), { viewerId: null });

    await (service as any).searchPosts('q');
    expect(qbs.posts.limit).toHaveBeenCalledWith(20);
    expect(qbs.posts.offset).toHaveBeenCalledWith(0);
    expect(qbs.posts.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
    expect(visibilityService.filterVisiblePostsForViewer).toHaveBeenCalledWith(null, []);

    await (service as any).searchHashtags('q');
    expect(qbs.tags.limit).toHaveBeenCalledWith(20);
    expect(qbs.tags.offset).toHaveBeenCalledWith(0);

    await (service as any).searchPlaces('q');
    expect(qbs.places.limit).toHaveBeenCalledWith(20);
    expect(qbs.places.offset).toHaveBeenCalledWith(0);

    await (service as any).searchGroups('q');
    expect(qbs.groups.limit).toHaveBeenCalledWith(20);
    expect(qbs.groups.offset).toHaveBeenCalledWith(0);

    await (service as any).searchEvents('q');
    expect(qbs.events.limit).toHaveBeenCalledWith(20);
    expect(qbs.events.offset).toHaveBeenCalledWith(0);

    await (service as any).searchProducts('q');
    expect(qbs.products.limit).toHaveBeenCalledWith(20);
    expect(qbs.products.offset).toHaveBeenCalledWith(0);
  });
});

describe('SearchService followUpSearch', () => {
  it('combines previous and follow-up queries and echoes them back', async () => {
    const { service, qbs } = makeHarness();
    qbs.users.getMany.mockResolvedValue([{ id: 'u9' }]);

    const result = await service.followUpSearch('  cats ', ' dogs ', 'viewer-1');

    expect(result.previousQuery).toBe('cats');
    expect(result.followUpQuery).toBe('dogs');
    expect(result.query).toBe('cats dogs');
    expect(result.users).toEqual([{ id: 'u9' }]);
    expect(qbs.users.setParameter).toHaveBeenCalledWith('ftsQuery', 'cats dogs');
    expect(qbs.users.andWhere).toHaveBeenCalledWith(expect.any(String), { viewerId: 'viewer-1' });
  });

  it('rejects a missing previous query', async () => {
    const { service } = makeHarness();
    await expect(service.followUpSearch(undefined as any, 'dogs')).rejects.toThrow(
      'Previous and follow-up search queries are required'
    );
  });

  it('rejects a whitespace-only follow-up query', async () => {
    const { service } = makeHarness();
    await expect(service.followUpSearch('cats', '   ')).rejects.toThrow(
      'Previous and follow-up search queries are required'
    );
  });
});

describe('SearchService reverseImageSearch', () => {
  it('returns recent public image posts without inspecting the uploaded file', async () => {
    const { service, qbs, repos } = makeHarness();
    qbs.posts.getMany.mockResolvedValue([{ id: 'p9', visibility: 'public' }]);

    const result = await service.reverseImageSearch({ originalname: 'pic.png' } as any);

    expect(result).toEqual([{ id: 'p9', visibility: 'public' }]);
    expect(repos.posts.createQueryBuilder).toHaveBeenCalledWith('post');
    expect(qbs.posts.innerJoin).toHaveBeenCalledWith('post.media', 'media');
    expect(qbs.posts.where).toHaveBeenCalledWith('post.visibility = :visibility', {
      visibility: 'public',
    });
    expect(qbs.posts.andWhere).toHaveBeenCalledWith('media.type = :mediaType', {
      mediaType: 'image',
    });
    expect(qbs.posts.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(qbs.posts.orderBy).toHaveBeenCalledWith('post."createdAt"', 'DESC');
    expect(qbs.posts.limit).toHaveBeenCalledWith(20);
    expect(qbs.posts.getMany).toHaveBeenCalledTimes(1);
  });

  it('works without an uploaded file', async () => {
    const { service, qbs } = makeHarness();
    qbs.posts.getMany.mockResolvedValue([]);

    const result = await service.reverseImageSearch();

    expect(result).toEqual([]);
    expect(qbs.posts.getMany).toHaveBeenCalledTimes(1);
  });
});

describe('SearchService imageTextSearch', () => {
  it('combines text results with image results and marks the preview note', async () => {
    const { service, qbs } = makeHarness();
    qbs.users.getMany.mockResolvedValue([{ id: 'u1' }]);
    qbs.posts.getMany.mockResolvedValue([{ id: 'p1' }]);

    const result = await service.imageTextSearch('  sky  ', { originalname: 'sky.png' } as any);

    expect(result.query).toBe('sky');
    expect(result.imageProvided).toBe(true);
    expect(result.note).toBe(
      'Reverse image matching is Preview — showing recent public image posts instead of perceptual matches.'
    );
    expect(result.users).toEqual([{ id: 'u1' }]);
    expect(result.imageSearchResults).toEqual([{ id: 'p1' }]);
    expect(qbs.users.setParameter).toHaveBeenCalledWith('ftsQuery', 'sky');
    expect(qbs.posts.innerJoin).toHaveBeenCalledWith('post.media', 'media');
  });

  it('skips the text query when the query is blank and reports no image', async () => {
    const { service, repos } = makeHarness();

    const result = await service.imageTextSearch('   ');

    expect(result).toEqual({
      users: [],
      posts: [],
      hashtags: [],
      places: [],
      groups: [],
      events: [],
      products: [],
      imageSearchResults: [],
      query: '',
      imageProvided: false,
    });
    expect(result.note).toBeUndefined();
    expect(repos.users.createQueryBuilder).not.toHaveBeenCalled();
    expect(repos.posts.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('handles an absent query value', async () => {
    const { service } = makeHarness();

    const result = await service.imageTextSearch(undefined as any);

    expect(result.query).toBe('');
    expect(result.imageProvided).toBe(false);
    expect(result.note).toBeUndefined();
  });
});

describe('SearchService webConnectedSearch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('merges the abstract and the valid related topics from DuckDuckGo', async () => {
    const { service } = makeHarness();
    const getSpy = jest.spyOn(axios as any, 'get').mockResolvedValue({
      data: {
        Heading: 'Mars',
        AbstractText: 'Mars is the fourth planet from the Sun.',
        AbstractURL: 'https://example.com/mars',
        RelatedTopics: [
          { Text: 'Mars surface', FirstURL: 'https://example.com/surface' },
          { Text: 'Topic without a URL' },
          { FirstURL: 'https://example.com/missing-text' },
          { Text: 'Mars moons', FirstURL: 'https://example.com/moons' },
        ],
      },
    });

    const result = await service.webConnectedSearch('  mars ');

    expect(getSpy).toHaveBeenCalledWith('https://api.duckduckgo.com/', {
      params: { q: 'mars', format: 'json', no_html: 1, skip_disambig: 1 },
      timeout: 5000,
    });
    expect(result).toEqual({
      query: 'mars',
      results: [
        {
          title: 'Mars',
          snippet: 'Mars is the fourth planet from the Sun.',
          url: 'https://example.com/mars',
        },
        { title: 'Mars surface', url: 'https://example.com/surface' },
        { title: 'Mars moons', url: 'https://example.com/moons' },
      ],
    });
  });

  it('uses the raw query as the title when the abstract has no heading', async () => {
    const { service } = makeHarness();
    jest.spyOn(axios as any, 'get').mockResolvedValue({
      data: { AbstractText: 'Just an abstract.', AbstractURL: 'https://example.com/a' },
    });

    const result = await service.webConnectedSearch('no heading');

    expect(result).toEqual({
      query: 'no heading',
      results: [
        { title: 'no heading', snippet: 'Just an abstract.', url: 'https://example.com/a' },
      ],
    });
  });

  it('returns an empty list when the API responds without a payload', async () => {
    const { service } = makeHarness();
    jest.spyOn(axios as any, 'get').mockResolvedValue({ data: undefined });

    const result = await service.webConnectedSearch('nothing');

    expect(result).toEqual({ query: 'nothing', results: [] });
  });

  it('maps API failures to a service-unavailable error', async () => {
    const { service } = makeHarness();
    jest.spyOn(axios as any, 'get').mockRejectedValue(new Error('ECONNRESET'));

    await expect(service.webConnectedSearch('mars')).rejects.toThrow(
      'Web search is temporarily unavailable'
    );
  });

  it('rejects a blank query without calling the API', async () => {
    const { service } = makeHarness();
    const getSpy = jest.spyOn(axios as any, 'get');

    await expect(service.webConnectedSearch('  ')).rejects.toThrow('Search query is required');
    expect(getSpy).not.toHaveBeenCalled();
    getSpy.mockRestore();
  });
});
