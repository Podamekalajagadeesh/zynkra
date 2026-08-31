import { TrendsService } from './trends.service';

describe('TrendsService time-based trends', () => {
  it('returns a trend updated within the requested time window', async () => {
    const findOne = jest.fn().mockResolvedValue({ tag: 'tech' });
    const service = new TrendsService(
      { findOne } as any,
      { findOne: jest.fn() } as any,
    );

    await expect(service.getTrendHistory(' #Tech ', 7)).resolves.toEqual({ tag: 'tech' });

    expect(findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tag: 'tech',
        lastUpdated: expect.anything(),
      }),
    });
  });

  it('ignores empty tags instead of querying the repository', async () => {
    const findOne = jest.fn();
    const service = new TrendsService(
      { findOne } as any,
      { findOne: jest.fn() } as any,
    );

    await expect(service.getTrendHistory('   ')).resolves.toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });
});