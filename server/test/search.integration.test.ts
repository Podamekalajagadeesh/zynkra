/**
 * Integration tests for Postgres full-text search (SearchService).
 * Uses mocked repositories that record query-builder calls to assert
 * FTS + visibility behavior without requiring a live database.
 */
import { SearchService } from '../src/search/search.service';

function makeQb() {
  const qb: any = {
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
  return qb;
}

describe('Search integration (FTS)', () => {
  let qbs: any[];
  let repo: any;
  let service: SearchService;

  beforeEach(() => {
    qbs = [];
    repo = {
      createQueryBuilder: jest.fn(() => {
        const qb = makeQb();
        qbs.push(qb);
        return qb;
      }),
      query: jest.fn().mockResolvedValue([]),
    };
    service = new SearchService(repo, repo, repo, repo, repo, repo, repo, {
      filterVisiblePostsForViewer: jest.fn(async (_v: any, posts: any) => posts),
    } as any);
  });

  it('searches all entity types with FTS + ILIKE fallback', async () => {
    const result = await service.search('zynkra test', 'viewer-1');

    expect(result).toEqual({
      users: [],
      posts: [],
      hashtags: [],
      places: [],
      groups: [],
      events: [],
      products: [],
    });
    // One query builder per entity type (7 total).
    expect(qbs.length).toBe(7);
    for (const qb of qbs) {
      expect(qb.where).toHaveBeenCalled();
      expect(qb.setParameter).toHaveBeenCalledWith('ftsQuery', 'zynkra test');
      expect(qb.setParameter).toHaveBeenCalledWith('pattern', '%zynkra test%');
      expect(qb.orderBy).toHaveBeenCalledWith(expect.stringContaining('ts_rank'), 'DESC');
    }
    // Users query applies searchVisibility gate.
    expect(qbs[0].andWhere).toHaveBeenCalledWith(expect.stringContaining('searchVisibility'), {
      viewerId: 'viewer-1',
    });
    // Posts pass through visibility filter.
    const visibility = (service as any).visibilityService;
    expect(visibility.filterVisiblePostsForViewer).toHaveBeenCalledWith('viewer-1', []);
  });

  it('advanced search by type routes to the correct entity', async () => {
    await service.advancedSearch({ query: 'foo', type: 'events', viewerId: 'v' });
    expect(qbs.length).toBe(1);
    expect(qbs[0].where).toHaveBeenCalled();
    expect(qbs[0].setParameter).toHaveBeenCalledWith('ftsQuery', 'foo');
  });

  it('advanced search by type=places works (was previously missing)', async () => {
    await service.advancedSearch({ query: 'paris', type: 'places' });
    expect(qbs.length).toBe(1);
    expect(qbs[0].where).toHaveBeenCalled();
  });

  it('popularity sort for posts uses repostCount not nonexistent likeCount', async () => {
    await service.advancedSearch({ query: 'x', type: 'posts', sort: 'popularity' });
    expect(qbs[0].orderBy).toHaveBeenCalledWith('post."repostCount"', 'DESC');
    const orderByArgs = qbs[0].orderBy.mock.calls[0];
    expect(orderByArgs[0]).not.toContain('likeCount');
  });

  it('event sort uses date not nonexistent startDate', async () => {
    await service.advancedSearch({ query: 'x', type: 'events' });
    expect(qbs[0].orderBy).toHaveBeenCalledWith('event.date', 'ASC');
    const orderByArgs = qbs[0].orderBy.mock.calls[0];
    expect(orderByArgs[0]).not.toContain('startDate');
  });

  it('reverse image search joins media table (posts have no imageUrls column)', async () => {
    await service.reverseImageSearch();
    expect(qbs[0].innerJoin).toHaveBeenCalledWith('post.media', 'media');
    expect(qbs[0].where).toHaveBeenCalledWith('post.visibility = :visibility', {
      visibility: 'public',
    });
    // Must not reference the nonexistent posts.imageUrls column.
    const whereArgs = qbs[0].where.mock.calls[0];
    expect(whereArgs[0]).not.toContain('imageUrls');
  });

  it('empty query throws BadRequest', async () => {
    await expect(service.search('')).rejects.toThrow('Search query is required');
    await expect(service.advancedSearch({ query: '  ' })).rejects.toThrow(
      'Search query is required'
    );
  });
});
