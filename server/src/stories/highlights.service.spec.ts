import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HighlightsService } from './highlights.service';
import { StoryHighlight } from './entities/story-highlight.entity';
import { StoriesService } from './stories.service';
import { UsersService } from '../users/users.service';

describe('HighlightsService', () => {
  let service: HighlightsService;
  let repo: jest.Mocked<Repository<StoryHighlight>>;
  let storiesService: jest.Mocked<StoriesService>;
  let usersService: jest.Mocked<UsersService>;

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
        {
          provide: StoriesService,
          useValue: { findMultipleByIds: jest.fn(), canViewStory: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
            findByUsername: jest.fn(),
            isBlockedBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(HighlightsService);
    repo = module.get(getRepositoryToken(StoryHighlight));
    storiesService = module.get(StoriesService);
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    const user = { id: 'user-1', username: 'alice' } as any;
    const dto = { title: 'Best of', coverUrl: '/covers/a.jpg', storyIds: ['s1', 's2'] };

    beforeEach(() => {
      usersService.findOneById.mockResolvedValue(user);
      repo.create.mockImplementation((data) => data as any);
      repo.save.mockImplementation(async (highlight) => ({ ...highlight, id: 'h1' }) as any);
      // The service re-fetches so the response carries the sanitized User entity.
      repo.findOne.mockResolvedValue({
        id: 'h1',
        user,
        stories: [{ id: 's1' }, { id: 's2' }],
      } as any);
    });

    it('deduplicates storyIds before the ownership lookup', async () => {
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }, { id: 's2' }] as any);

      const result = await service.create({ ...dto, storyIds: ['s1', 's1', 's2'] }, 'user-1');

      expect(storiesService.findMultipleByIds).toHaveBeenCalledWith(['s1', 's2'], 'user-1');
      expect(result.stories).toHaveLength(2);
    });

    it('throws NotFound when a unique story id is missing or foreign', async () => {
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }] as any);

      await expect(
        service.create({ ...dto, storyIds: ['s1', 's1', 's-foreign'] }, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the re-fetched entity so the user is a real User (no JWT principal leak)', async () => {
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }, { id: 's2' }] as any);
      const cleanUser = { id: 'user-1', username: 'alice' } as any;
      repo.findOne.mockResolvedValue({ id: 'h1', user: cleanUser } as any);

      const result = await service.create(dto, 'user-1');

      expect(usersService.findOneById).toHaveBeenCalledWith('user-1');
      expect(result.user).toBe(cleanUser);
      expect(result.user).not.toHaveProperty('role');
      expect(result.user).not.toHaveProperty('sessionId');
      // create() must never persist the raw principal as the relation target.
      expect(usersService.findOneById).toHaveBeenCalledTimes(1);
    });

    it('throws NotFound when the caller no longer exists', async () => {
      usersService.findOneById.mockResolvedValue(undefined as any);

      await expect(service.create(dto, 'ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lists own highlights newest-first', async () => {
      repo.find.mockResolvedValue([
        { id: 'h2', createdAt: new Date('2026-01-02') },
        { id: 'h1', createdAt: new Date('2026-01-01') },
      ] as any);

      const result = await service.findAll('user-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        order: { createdAt: 'DESC' },
      });
      expect(result.map((h) => h.id)).toEqual(['h2', 'h1']);
    });
  });

  describe('findForUser', () => {
    const target = { id: 'user-2', username: 'bob' } as any;
    const viewer = {
      id: 'user-1',
      following: [],
      followers: [],
      closeFriendsWith: [],
    } as any;

    beforeEach(() => {
      usersService.findByUsername.mockResolvedValue(target);
      usersService.isBlockedBy.mockResolvedValue(false);
      usersService.findOneById.mockResolvedValue(viewer);
    });

    it('returns the caller their own highlights regardless of story visibility', async () => {
      const own = [{ id: 'h1', user: target, stories: [{ id: 's1' }] }] as any;
      repo.find.mockResolvedValue(own);

      const result = await service.findForUser('user-2', 'user-2');

      expect(result).toEqual(own);
      expect(usersService.isBlockedBy).not.toHaveBeenCalled();
      expect(storiesService.canViewStory).not.toHaveBeenCalled();
    });

    it('orders other users highlights newest-first', async () => {
      repo.find.mockResolvedValue([]);

      await service.findForUser('bob', 'user-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-2' } },
        order: { createdAt: 'DESC' },
      });
    });

    it('keeps only highlights that still hold a story the viewer may see', async () => {
      repo.find.mockResolvedValue([
        { id: 'h-visible', stories: [{ id: 's1' }, { id: 's2' }] },
        { id: 'h-hidden', stories: [{ id: 's3' }] },
      ] as any);
      storiesService.canViewStory
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(false as any)
        .mockResolvedValueOnce(false as any);

      const result = await service.findForUser('user-2', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('h-visible');
      expect(result[0].stories).toEqual([{ id: 's1' }]);
    });

    it('hides everything when a block exists in either direction', async () => {
      usersService.isBlockedBy.mockResolvedValueOnce(true as any);

      await expect(service.findForUser('user-2', 'user-1')).resolves.toEqual([]);
      expect(repo.find).not.toHaveBeenCalled();

      usersService.isBlockedBy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      await expect(service.findForUser('user-2', 'user-1')).resolves.toEqual([]);
    });

    it('throws NotFound for an unknown user', async () => {
      usersService.findByUsername.mockResolvedValue(undefined as any);

      await expect(service.findForUser('ghost', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('falls back to an id lookup only for uuid-shaped identifiers', async () => {
      usersService.findByUsername.mockResolvedValue(undefined as any);
      usersService.findOneById
        .mockResolvedValueOnce(target as any)
        .mockResolvedValueOnce({ id: 'user-1', following: [], followers: [] } as any);
      repo.find.mockResolvedValue([]);

      await service.findForUser('3d8c5f2e-1a2b-4c3d-8e4f-5a6b7c8d9e0f', 'user-1');

      expect(usersService.findOneById).toHaveBeenNthCalledWith(
        1,
        '3d8c5f2e-1a2b-4c3d-8e4f-5a6b7c8d9e0f'
      );
      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-2' } },
        order: { createdAt: 'DESC' },
      });
    });

    it('returns an empty list when the viewer account is gone', async () => {
      repo.find.mockResolvedValue([{ id: 'h1', stories: [{ id: 's1' }] }] as any);
      usersService.findOneById.mockResolvedValue(undefined as any);

      await expect(service.findForUser('user-2', 'user-1')).resolves.toEqual([]);
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

      await expect(service.update('h1', { title: 'New' }, 'other-user')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('applies title without leaking storyIds onto the entity', async () => {
      const highlight = { id: 'h1', user: { id: 'user-1' }, title: 'Old' } as any;
      repo.findOne.mockResolvedValue(highlight);
      repo.save.mockImplementation(async (entity) => entity as any);

      const result = await service.update('h1', { title: 'New' }, 'user-1');

      expect(result.title).toBe('New');
      expect('storyIds' in result).toBe(false);
    });

    it('deduplicates replacement storyIds', async () => {
      const highlight = { id: 'h1', user: { id: 'user-1' }, stories: [] } as any;
      repo.findOne.mockResolvedValue(highlight);
      storiesService.findMultipleByIds.mockResolvedValue([{ id: 's1' }] as any);
      repo.save.mockImplementation(async (entity) => entity as any);

      await service.update('h1', { storyIds: ['s1', 's1'] }, 'user-1');

      expect(storiesService.findMultipleByIds).toHaveBeenCalledWith(['s1'], 'user-1');
      expect('storyIds' in highlight).toBe(false);
    });
  });

  describe('remove', () => {
    it('removes a highlight the caller owns', async () => {
      const highlight = { id: 'h1', user: { id: 'user-1' } } as any;
      repo.findOne.mockResolvedValue(highlight);
      repo.remove.mockImplementation(async (entity) => entity as any);

      await expect(service.remove('h1', 'user-1')).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(highlight);
    });

    it('rejects a non-owner', async () => {
      repo.findOne.mockResolvedValue({ id: 'h1', user: { id: 'user-1' } } as any);

      await expect(service.remove('h1', 'other-user')).rejects.toThrow(UnauthorizedException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('throws NotFound for a missing highlight', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
