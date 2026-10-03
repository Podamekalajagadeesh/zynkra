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
      visibilityService as any,
    );

    await service.search('alex', 'viewer-id');

    expect(queryBuilder.where).toHaveBeenCalledWith(expect.any(Brackets));
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user."searchVisibility" = \'everyone\''),
      { viewerId: 'viewer-id' },
    );
    expect(queryBuilder.andWhere.mock.invocationCallOrder[0])
      .toBeGreaterThan(queryBuilder.where.mock.invocationCallOrder[0]);
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
      visibilityService as any,
    );

    await service.search('hello world', 'viewer-id');

    // First where() is the users FTS Brackets — its SQL must reference searchVector + tsquery.
    const firstWhereArg = queryBuilder.where.mock.calls[0][0];
    expect(firstWhereArg).toBeInstanceOf(Brackets);
    // Brackets wraps a callback; inspect setParameter + orderBy for FTS usage.
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('ts_rank'),
      'DESC',
    );
    expect(queryBuilder.setParameter).toHaveBeenCalledWith('ftsQuery', 'hello world');
  });

  it('rejects empty queries', async () => {
    const service = new SearchService(
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
      { filterVisiblePostsForViewer: jest.fn() } as any,
    );
    await expect(service.search('   ', 'viewer')).rejects.toThrow('Search query is required');
  });
});
