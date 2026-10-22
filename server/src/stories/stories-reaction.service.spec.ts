import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoriesReactionService } from './stories-reaction.service';
import { StoryReaction } from './entities/story-reaction.entity';
import { StoriesService } from './stories.service';

describe('StoriesReactionService', () => {
  let service: StoriesReactionService;
  let repo: jest.Mocked<Repository<StoryReaction>>;
  let storiesService: jest.Mocked<StoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesReactionService,
        {
          provide: getRepositoryToken(StoryReaction),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        { provide: StoriesService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(StoriesReactionService);
    repo = module.get(getRepositoryToken(StoryReaction));
    storiesService = module.get(StoriesService);
  });

  it('creates the first reaction for a story', async () => {
    storiesService.findOne.mockResolvedValue({ id: 'story-1' } as any);
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((data) => ({ id: 'r-1', ...data }) as any);
    repo.save.mockImplementation(async (reaction) => reaction as any);

    const result = await service.addReaction('user-1', 'story-1', '👍');

    expect(result.id).toBe('r-1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reaction: '👍',
        user: expect.objectContaining({ id: 'user-1' }),
      })
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('replaces the existing reaction instead of inserting a duplicate row', async () => {
    storiesService.findOne.mockResolvedValue({ id: 'story-1' } as any);
    const existing = { id: 'r-1', reaction: '👍' } as any;
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (reaction) => reaction as any);

    const result = await service.addReaction('user-1', 'story-1', '❤️');

    expect(result.id).toBe('r-1');
    expect(result.reaction).toBe('❤️');
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { story: { id: 'story-1' }, user: { id: 'user-1' } },
    });
  });

  it('throws NotFoundException when the story is not visible to the user', async () => {
    storiesService.findOne.mockResolvedValue(null);

    await expect(service.addReaction('user-1', 'missing', '👍')).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
