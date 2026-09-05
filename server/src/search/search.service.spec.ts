import { Brackets } from 'typeorm';
import { SearchService } from './search.service';

describe('SearchService search visibility', () => {
  it('applies visibility to both username and display-name matches', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
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
});