import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoriesService } from './stories.service';
import { Story } from './entities/story.entity';
import { StoryElement } from './entities/story-element.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReaction } from './entities/story-reaction.entity';
import { StoryReply } from './entities/story-reply.entity';
import { UsersService } from '../users/users.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';

function makeStory(overrides: any = {}) {
  return {
    id: 'story-1', user: { id: 'user-1' }, mediaUrl: '/uploads/story.jpg',
    audience: 'public', expiresAt: new Date(Date.now() + 86400000),
    isBoosted: false, createdAt: new Date(), ...overrides,
  };
}

function makeUser(overrides: any = {}) {
  return { id: 'user-1', username: 'testuser', following: [], closeFriendsWith: [], ...overrides };
}

describe('StoriesService', () => {
  let service: StoriesService;
  let storyRepo: jest.Mocked<Repository<Story>>;
  let storyViewRepo: jest.Mocked<Repository<StoryView>>;
  let usersService: jest.Mocked<UsersService>;
  let subRepo: jest.Mocked<Repository<Subscription>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: getRepositoryToken(Story), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), delete: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(StoryElement), useValue: { find: jest.fn(), create: jest.fn(), remove: jest.fn() } },
        { provide: getRepositoryToken(StoryView), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(StoryReaction), useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(StoryReply), useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: UsersService, useValue: { findOneById: jest.fn() } },
        { provide: getRepositoryToken(Subscription), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    storyRepo = module.get(getRepositoryToken(Story));
    storyViewRepo = module.get(getRepositoryToken(StoryView));
    usersService = module.get(UsersService);
    subRepo = module.get(getRepositoryToken(Subscription));
  });

  // ─── create ───────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a story with media', async () => {
      usersService.findOneById.mockResolvedValue(makeUser());
      storyRepo.save.mockResolvedValue(makeStory());

      const result = await service.create({ mediaUrl: '/uploads/story.jpg' } as any, 'user-1');
      expect(storyRepo.save).toHaveBeenCalled();
    });

    it('creates a story with text only', async () => {
      usersService.findOneById.mockResolvedValue(makeUser());
      storyRepo.save.mockResolvedValue(makeStory({ textContent: 'Hello' }));

      const result = await service.create({ textContent: 'Hello' } as any, 'user-1');
      expect(storyRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when no media and no text', async () => {
      await expect(service.create({} as any, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a story by id', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory() as any);

      const result = await service.findOne('story-1');
      expect(result).toBeDefined();
    });

    it('returns null when not found', async () => {
      storyRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne('missing');
      expect(result).toBeNull();
    });
  });

  // ─── trackView ────────────────────────────────────────────────────────

  describe('trackView', () => {
    it('creates a new StoryView for first view', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory() as any);
      usersService.findOneById.mockResolvedValue(makeUser() as any);
      storyViewRepo.findOne.mockResolvedValue(null);
      storyViewRepo.create.mockReturnValue({ id: 'sv-1' } as any);
      storyViewRepo.save.mockResolvedValue({ id: 'sv-1' } as any);

      await service.trackView('story-1', 'user-2', false);
      expect(storyViewRepo.create).toHaveBeenCalled();
    });

    it('increments rewatchCount for existing view', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory() as any);
      usersService.findOneById.mockResolvedValue(makeUser() as any);
      const existingView = { id: 'sv-1', rewatchCount: 1, viewTimestamps: [] } as any;
      storyViewRepo.findOne.mockResolvedValue(existingView);
      storyViewRepo.save.mockResolvedValue(existingView);

      await service.trackView('story-1', 'user-2', false);
      expect(existingView.rewatchCount).toBe(2);
      expect(storyViewRepo.save).toHaveBeenCalled();
    });
  });

  // ─── getViews ─────────────────────────────────────────────────────────

  describe('getViews', () => {
    it('returns views for story owner', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory() as any);
      storyViewRepo.find.mockResolvedValue([{ id: 'sv-1' }] as any);

      const result = await service.getViews('story-1', 'user-1');
      expect(result).toHaveLength(1);
    });

    it('throws UnauthorizedException for non-owner', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory() as any);
      await expect(service.getViews('story-1', 'other-user')).rejects.toThrow();
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes a story when owner', async () => {
      usersService.findOneById.mockResolvedValue(makeUser() as any);
      storyRepo.findOne.mockResolvedValue(makeStory() as any);
      storyViewRepo.delete.mockResolvedValue({ affected: 0 } as any);
      storyRepo.delete.mockResolvedValue(undefined as any);

      await service.delete('story-1', 'user-1');
      expect(storyRepo.delete).toHaveBeenCalledWith('story-1');
    });

    it('throws when user not found', async () => {
      usersService.findOneById.mockResolvedValue(null);
      await expect(service.delete('story-1', 'missing-user')).rejects.toThrow();
    });
  });
});
