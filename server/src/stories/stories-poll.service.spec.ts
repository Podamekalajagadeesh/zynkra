import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoriesPollService } from './stories-poll.service';
import { StoryPollVote } from './entities/story-poll-vote.entity';
import { StoriesService } from './stories.service';

function makePollStory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'story-1',
    user: { id: 'user-1' },
    expiresAt: new Date(Date.now() + 86_400_000),
    elements: [
      { id: 'el-poll', type: 'poll', data: { question: 'Best?', options: ['A', 'B', 'C'] } },
      { id: 'el-mention', type: 'mention', data: { username: 'friend' } },
    ],
    ...overrides,
  };
}

describe('StoriesPollService', () => {
  let service: StoriesPollService;
  let repo: jest.Mocked<Repository<StoryPollVote>>;
  let storiesService: jest.Mocked<StoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesPollService,
        {
          provide: getRepositoryToken(StoryPollVote),
          useValue: { query: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() },
        },
        { provide: StoriesService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(StoriesPollService);
    repo = module.get(getRepositoryToken(StoryPollVote));
    storiesService = module.get(StoriesService);
  });

  describe('vote', () => {
    it('casts a vote through a single atomic upsert and returns dense results', async () => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);
      // 1st query: upsert; 2nd query: GROUP BY counts.
      repo.query
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([{ optionIndex: 1, count: 2 }] as any);
      repo.findOne.mockResolvedValue({ id: 'v1', optionIndex: 1 } as any);

      const result = await service.vote('story-1', 'el-poll', 'user-1', 1);

      expect(repo.query).toHaveBeenCalledTimes(2);
      const [upsertSql, upsertParams] = repo.query.mock.calls[0] as [string, unknown[]];
      expect(upsertSql).toContain('ON CONFLICT ("elementId", "userId")');
      expect(upsertSql).toContain('DO UPDATE SET "optionIndex" = EXCLUDED."optionIndex"');
      expect(upsertParams).toEqual([1, 'user-1', 'el-poll']);
      expect(result).toEqual({ optionCounts: [0, 2, 0], totalVotes: 2, myVote: 1 });
    });

    it('hides votes on invisible stories', async () => {
      storiesService.findOne.mockResolvedValue(null);

      await expect(service.vote('story-1', 'el-poll', 'user-1', 0)).rejects.toThrow(
        NotFoundException
      );
      expect(repo.query).not.toHaveBeenCalled();
    });

    it('rejects votes on expired stories', async () => {
      storiesService.findOne.mockResolvedValue(
        makePollStory({ expiresAt: new Date(Date.now() - 1000) }) as any
      );

      await expect(service.vote('story-1', 'el-poll', 'user-1', 0)).rejects.toThrow(
        BadRequestException
      );
      expect(repo.query).not.toHaveBeenCalled();
    });

    it('rejects voting on a non-poll element', async () => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);

      await expect(service.vote('story-1', 'el-mention', 'user-1', 0)).rejects.toThrow(
        NotFoundException
      );
      expect(repo.query).not.toHaveBeenCalled();
    });

    it('rejects an unknown element id', async () => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);

      await expect(service.vote('story-1', 'el-missing', 'user-1', 0)).rejects.toThrow(
        NotFoundException
      );
    });

    it.each([3, -1, 1.5])('rejects out-of-range or non-integer index %s', async (index) => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);

      await expect(service.vote('story-1', 'el-poll', 'user-1', index)).rejects.toThrow(
        BadRequestException
      );
      expect(repo.query).not.toHaveBeenCalled();
    });

    it('rejects a poll element whose options are missing', async () => {
      storiesService.findOne.mockResolvedValue(
        makePollStory({
          elements: [{ id: 'el-poll', type: 'poll', data: { question: 'No options?' } }],
        }) as any
      );

      await expect(service.vote('story-1', 'el-poll', 'user-1', 0)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getResults', () => {
    it('returns counts, total, and myVote without casting anything', async () => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);
      repo.query.mockResolvedValueOnce([
        { optionIndex: 0, count: 3 },
        { optionIndex: 2, count: 1 },
      ] as any);
      repo.findOne.mockResolvedValue({ id: 'v1', optionIndex: 2 } as any);

      const result = await service.getResults('story-1', 'el-poll', 'user-2');

      expect(result).toEqual({ optionCounts: [3, 0, 1], totalVotes: 4, myVote: 2 });
      expect(repo.query).toHaveBeenCalledTimes(1);
      expect(String(repo.query.mock.calls[0][0])).toContain('COUNT(*)::int');
    });

    it('returns myVote null for a user who has not voted', async () => {
      storiesService.findOne.mockResolvedValue(makePollStory() as any);
      repo.query.mockResolvedValueOnce([] as any);
      repo.findOne.mockResolvedValue(null);

      const result = await service.getResults('story-1', 'el-poll', 'user-2');

      expect(result).toEqual({ optionCounts: [0, 0, 0], totalVotes: 0, myVote: null });
    });
  });
});
