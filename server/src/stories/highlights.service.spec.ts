import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HighlightsService } from './highlights.service';
import { StoryHighlight } from './entities/story-highlight.entity';
import { StoriesService } from './stories.service';

describe('HighlightsService', () => {
  let service: HighlightsService;
  let repo: jest.Mocked<Repository<StoryHighlight>>;
  let storiesService: jest.Mocked<StoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighlightsService,
        {
          provide: getRepositoryToken(StoryHighlight),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: StoriesService, useValue: { findMultipleByIds: jest.fn() } },
      ],
    }).compile();

    service = module.get(HighlightsService);
    repo = module.get(getRepositoryToken(StoryHighlight));
    storiesService = module.get(StoriesService);
  });

  describe('create', () => {
    const user = { id: 'user-1' } as any;
    const dto = { title: 'Best of', coverUrl: '/covers/a.jpg', storyIds: ['s1', 's2'] };

    it('deduplicates storyIds before the ownership lookup', async () => {
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }, { id: 's2' }] as any);
      repo.create.mockImplementation((data) => data as any);
      repo.save.mockImplementation(async (highlight) => highlight as any);

      const result = await service.create({ ...dto, storyIds: ['s1', 's1', 's2'] } as any, user);

      expect(storiesService.findMultipleByIds).toHaveBeenCalledWith(['s1', 's2'], 'user-1');
      expect(result.stories).toHaveLength(2);
    });

    it('throws NotFound when a unique story id is missing or foreign', async () => {
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }] as any);

      await expect(
        service.create({ ...dto, storyIds: ['s1', 's1', 's-foreign'] } as any, user)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns the highlight to its owner', async () => {
      repo.findOne.mockResolvedValue({ id: 'h1', user: { id: 'user-1' } } as any);

      await expect(service.findOne('h1', 'user-1')).resolves.toMatchObject({ id: 'h1' });
    });

    it('rejects a different viewer (no cross-user highlight reads)', async () => {
      repo.findOne.mockResolvedValue({ id: 'h1', user: { id: 'user-1' } } as any);

      await expect(service.findOne('h1', 'other-user')).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFound for a missing highlight', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects a non-owner', async () => {
      repo.findOne.mockResolvedValue({ id: 'h1', user: { id: 'user-1' } } as any);

      await expect(
        service.update('h1', { title: 'New' }, { id: 'other-user' } as any)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('applies title without leaking storyIds onto the entity', async () => {
      const highlight = { id: 'h1', user: { id: 'user-1' }, title: 'Old' } as any;
      repo.findOne.mockResolvedValue(highlight);
      repo.save.mockImplementation(async (entity) => entity as any);

      const result = await service.update('h1', { title: 'New' }, { id: 'user-1' } as any);

      expect(result.title).toBe('New');
      expect('storyIds' in result).toBe(false);
    });

    it('deduplicates replacement storyIds', async () => {
      const highlight = { id: 'h1', user: { id: 'user-1' }, stories: [] } as any;
      repo.findOne.mockResolvedValue(highlight);
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }] as any);
      repo.save.mockImplementation(async (entity) => entity as any);

      await service.update('h1', { storyIds: ['s1', 's1'] }, { id: 'user-1' } as any);

      expect(storiesService.findMultipleByIds).toHaveBeenCalledWith(['s1'], 'user-1');
      expect('storyIds' in highlight).toBe(false);
    });
  });
});
