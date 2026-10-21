import { TrendsService } from './trends.service';

describe('TrendsService', () => {
  let trendsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let usersRepository: { findOne: jest.Mock };
  let service: TrendsService;

  function makeQueryBuilder(result: unknown = []) {
    return {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
  }

  beforeEach(() => {
    trendsRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((input: object) => ({ ...input })),
      save: jest.fn(async (row: object) => row),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };
    usersRepository = { findOne: jest.fn() };
    service = new TrendsService(trendsRepository as never, usersRepository as never);
    jest.useFakeTimers({ now: new Date('2026-06-01T12:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('processContent', () => {
    it('ignores content without hashtags', async () => {
      await service.processContent('plain text only', 'post');
      expect(trendsRepository.findOne).not.toHaveBeenCalled();
      expect(trendsRepository.save).not.toHaveBeenCalled();
    });

    it('creates a trend for each hashtag using content-type weights', async () => {
      trendsRepository.findOne.mockResolvedValue(null);

      await service.processContent('#Alpha and #beta #alpha', 'post');

      const tags = trendsRepository.create.mock.calls.map(([row]) => row.tag);
      // processContent does not dedupe — that is extractAndScoreHashtags' job
      expect(tags).toEqual(['#alpha', '#beta', '#alpha']);
      expect(trendsRepository.create.mock.calls[0][0]).toMatchObject({
        score: 10,
        occurrenceCount: 1,
        location: null,
      });
    });

    it('weights stories below posts and comments below stories', async () => {
      trendsRepository.findOne.mockResolvedValue(null);
      await service.processContent('#tag', 'story');
      expect(trendsRepository.create.mock.calls[0][0].score).toBeCloseTo(7);
      trendsRepository.create.mockClear();

      await service.processContent('#tag', 'comment');
      expect(trendsRepository.create.mock.calls[0][0].score).toBeCloseTo(3);
    });

    it('applies the author weight multiplicatively', async () => {
      trendsRepository.findOne.mockResolvedValue(null);
      await service.processContent('#tag', 'post', 2.5);
      expect(trendsRepository.create.mock.calls[0][0].score).toBeCloseTo(25);
    });

    it('looks up a location-scoped trend when a location is given', async () => {
      trendsRepository.findOne.mockResolvedValue(null);
      await service.processContent('#tag', 'post', 1, 'hyderabad');
      expect(trendsRepository.findOne).toHaveBeenCalledWith({
        where: { tag: '#tag', location: 'hyderabad' },
      });
      expect(trendsRepository.create.mock.calls[0][0].location).toBe('hyderabad');
    });

    it('applies time decay before incrementing an existing trend', async () => {
      trendsRepository.findOne.mockResolvedValue({
        tag: '#tag',
        score: 100,
        occurrenceCount: 3,
        lastUpdated: new Date('2026-06-01T02:00:00Z'), // 10 hours ago
        location: null,
      });

      await service.processContent('#tag', 'post');

      const decayed = 100 * Math.pow(0.95, 10);
      expect(trendsRepository.save.mock.calls[0][0]).toMatchObject({
        score: decayed + 10,
        occurrenceCount: 4,
        lastUpdated: new Date('2026-06-01T12:00:00Z'),
      });
    });
  });

  describe('query surfaces', () => {
    it('getTrending orders global trends by score within the day window', async () => {
      const qb = makeQueryBuilder([{ tag: '#a' }]);
      trendsRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTrending(5, 3);

      expect(result).toEqual([{ tag: '#a' }]);
      expect(qb.where).toHaveBeenCalledWith(
        'trend.lastUpdated >= :cutoff AND trend.location IS NULL',
        { cutoff: expect.any(Date) }
      );
      expect(qb.orderBy).toHaveBeenCalledWith('trend.score', 'DESC');
      expect(qb.take).toHaveBeenCalledWith(5);
      const { cutoff } = qb.where.mock.calls[0][1];
      expect(cutoff.toISOString()).toBe('2026-05-29T12:00:00.000Z');
    });

    it('getTrendingByLocation scopes the query to the location', async () => {
      const qb = makeQueryBuilder([]);
      trendsRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getTrendingByLocation('delhi', 8, 2);

      expect(qb.where).toHaveBeenCalledWith(
        'trend.lastUpdated >= :cutoff AND trend.location = :location',
        { cutoff: expect.any(Date), location: 'delhi' }
      );
      expect(qb.take).toHaveBeenCalledWith(8);
    });

    it('getTrendHistory normalizes the tag and defaults a bad day window to 30', async () => {
      trendsRepository.findOne.mockResolvedValue(null);

      await service.getTrendHistory('  #TagOne  ', Number.NaN);

      expect(trendsRepository.findOne).toHaveBeenCalledWith({
        where: {
          tag: 'tagone',
          lastUpdated: expect.objectContaining({}),
        },
      });
    });

    it('returns a trend updated within the requested time window', async () => {
      trendsRepository.findOne.mockResolvedValue({ tag: 'tech' });
      await expect(service.getTrendHistory(' #Tech ', 7)).resolves.toEqual({ tag: 'tech' });
      expect(trendsRepository.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({ tag: 'tech' }),
      });
    });

    it('getTrendHistory returns null for an empty tag', async () => {
      await expect(service.getTrendHistory('   #')).resolves.toBeNull();
      expect(trendsRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getPersonalizedTrends', () => {
    it('falls back to global trends when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const spy = jest.spyOn(service, 'getTrending').mockResolvedValue([{ tag: '#g' }] as never);

      await expect(service.getPersonalizedTrends('u1', 3)).resolves.toEqual([{ tag: '#g' }]);
      expect(spy).toHaveBeenCalledWith(3, 7);
    });

    it('falls back to global trends when the user follows nothing', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 'u1', followedTrends: [] });
      const spy = jest.spyOn(service, 'getTrending').mockResolvedValue([]);

      await service.getPersonalizedTrends('u1', 5);
      expect(spy).toHaveBeenCalledWith(5, 7);
    });

    it('boosts, sorts, limits, and strips the internal score field', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'u1',
        followedTrends: [{ tag: 'ai' }],
      });
      jest.spyOn(service, 'getTrending').mockResolvedValue([
        { tag: '#other', score: 100 },
        { tag: '#aitools', score: 40 },
        { tag: '#another', score: 50 },
      ] as never);

      const result = await service.getPersonalizedTrends('u1', 2);

      expect(result.map((t) => t.tag)).toEqual(['#other', '#aitools']);
      expect(result[0]).not.toHaveProperty('personalizedScore');
      // #aitools was boosted 40 * 1.5 = 60, beating #another (50)
      expect(result[1].score).toBe(40);
    });
  });

  describe('event scoring', () => {
    it('incrementTrendForEvent applies per-event weights', async () => {
      trendsRepository.findOne.mockResolvedValue(null);

      await service.incrementTrendForEvent('#Tag', 'share');
      expect(trendsRepository.create.mock.calls[0][0]).toMatchObject({ tag: '#tag', score: 15 });

      await service.incrementTrendForEvent('#Tag', 'like', 2);
      // like weight 0.5 × authorWeight 2 = 1.0 → increment 10
      expect(trendsRepository.create.mock.calls[1][0]).toMatchObject({ tag: '#tag', score: 10 });
    });

    it('extractAndScoreHashtags dedupes and lowercases', async () => {
      trendsRepository.findOne.mockResolvedValue(null);
      await service.extractAndScoreHashtags('#Mix #mix #OTHER');
      const tags = trendsRepository.create.mock.calls.map(([row]) => row.tag);
      // matches are sliced past the leading '#' before tracking
      expect(tags).toEqual(['mix', 'other']);
    });

    it('extractAndScoreHashtags is a no-op without matches', async () => {
      await service.extractAndScoreHashtags('no tags here');
      expect(trendsRepository.findOne).not.toHaveBeenCalled();
    });

    it('trackHashtag weights shares twice and comments at half', async () => {
      trendsRepository.findOne.mockResolvedValue(null);
      await service.trackHashtag('shared', 'share');
      expect(trendsRepository.create.mock.calls[0][0].score).toBe(20);

      await service.trackHashtag('discussed', 'comment');
      expect(trendsRepository.create.mock.calls[1][0].score).toBe(5);

      await service.trackHashtag('unknown-type');
      expect(trendsRepository.create.mock.calls[2][0].score).toBe(10);
    });
  });

  describe('maintenance jobs', () => {
    it('cleanupOldTrends deletes stale low-score rows', async () => {
      const qb = makeQueryBuilder();
      trendsRepository.createQueryBuilder.mockReturnValue(qb);

      await service.cleanupOldTrends();

      expect(qb.delete).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('lastUpdated < :oneWeekAgo AND score < :threshold', {
        oneWeekAgo: new Date('2026-05-25T12:00:00Z'),
        threshold: 1,
      });
      expect(qb.execute).toHaveBeenCalled();
    });

    it('recalculateAllScores removes, updates, and leaves rows alone as appropriate', async () => {
      const now = new Date('2026-06-01T12:00:00Z');
      trendsRepository.find.mockResolvedValue([
        // 10h decay → stays above threshold, gets updated
        { tag: '#keep', score: 100, lastUpdated: new Date('2026-06-01T02:00:00Z') },
        // fresh enough that decay leaves it unchanged
        { tag: '#same', score: 50, lastUpdated: now },
        // very stale → decays below threshold, removed
        {
          tag: '#gone',
          score: 5,
          lastUpdated: new Date('2025-01-01T00:00:00Z'),
        },
      ]);

      await service.recalculateAllScores();

      expect(trendsRepository.remove).toHaveBeenCalledTimes(1);
      expect(trendsRepository.remove.mock.calls[0][0].tag).toBe('#gone');
      expect(trendsRepository.save).toHaveBeenCalledTimes(1);
      const saved = trendsRepository.save.mock.calls[0][0];
      expect(saved.tag).toBe('#keep');
      expect(saved.score).toBeCloseTo(100 * Math.pow(0.95, 10));
      expect(saved.lastUpdated).toEqual(now);
    });
  });
});
