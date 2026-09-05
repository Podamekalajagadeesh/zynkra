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
import { CustomAudience } from '../custom-audiences/entities/custom-audience.entity';

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
  let customAudienceRepo: jest.Mocked<Repository<CustomAudience>>;

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
        { provide: getRepositoryToken(CustomAudience), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    storyRepo = module.get(getRepositoryToken(Story));
    storyViewRepo = module.get(getRepositoryToken(StoryView));
    usersService = module.get(UsersService);
    subRepo = module.get(getRepositoryToken(Subscription));
    customAudienceRepo = module.get(getRepositoryToken(CustomAudience));
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

    it('hides an only-me story from another user', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory({
        user: { id: 'owner-1', storyVisibility: 'only_me' },
      }) as any);
      usersService.findOneById.mockResolvedValue(makeUser({
        id: 'viewer-1',
        following: [{ id: 'owner-1' }],
        followers: [],
        closeFriendsWith: [],
      }) as any);

      const result = await service.findOne('story-1', 'viewer-1');

      expect(result).toBeNull();
    });

    it('allows a follower to view a followers-only story', async () => {
      const story = makeStory({
        user: { id: 'owner-1', storyVisibility: 'followers' },
      });
      storyRepo.findOne.mockResolvedValue(story as any);
      usersService.findOneById.mockResolvedValue(makeUser({
        id: 'viewer-1',
        following: [{ id: 'owner-1' }],
        followers: [],
        closeFriendsWith: [],
      }) as any);

      const result = await service.findOne('story-1', 'viewer-1');

      expect(result).toBe(story);
    });

    it('allows only members of a custom audience to view a story', async () => {
      const story = makeStory({
        user: { id: 'owner-1' },
        audience: 'custom',
        customAudienceId: 'audience-1',
      });
      storyRepo.findOne.mockResolvedValue(story as any);
      customAudienceRepo.findOne.mockResolvedValue({
        id: 'audience-1', userId: 'owner-1', userIds: ['viewer-1'],
      } as any);
      usersService.findOneById.mockResolvedValue(makeUser({ id: 'viewer-1' }) as any);

      await expect(service.findOne('story-1', 'viewer-1')).resolves.toBe(story);

      usersService.findOneById.mockResolvedValue(makeUser({ id: 'viewer-2' }) as any);
      await expect(service.findOne('story-1', 'viewer-2')).resolves.toBeNull();
    });

    it('hides an explicitly excluded viewer', async () => {
      const story = makeStory({
        user: { id: 'owner-1' },
        excludedUserIds: ['viewer-1'],
      });
      storyRepo.findOne.mockResolvedValue(story as any);
      usersService.findOneById.mockResolvedValue(makeUser({ id: 'viewer-1' }) as any);

      await expect(service.findOne('story-1', 'viewer-1')).resolves.toBeNull();
    });
  });

  describe('findActiveStoriesForUser privacy', () => {
    it('filters stories according to the owner story visibility setting', async () => {
      const viewer = makeUser({
        following: [{ id: 'followers-owner' }, { id: 'friends-owner' }, { id: 'private-owner' }],
        closeFriendsWith: [],
        followers: [{ id: 'friends-owner' }],
      });
      usersService.findOneById.mockResolvedValue(viewer as any);
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          makeStory({ user: { id: 'public-owner', storyVisibility: 'public' } }),
          makeStory({ id: 'story-2', user: { id: 'followers-owner', storyVisibility: 'followers' } }),
          makeStory({ id: 'story-3', user: { id: 'friends-owner', storyVisibility: 'friends' } }),
          makeStory({ id: 'story-4', user: { id: 'private-owner', storyVisibility: 'only_me' } }),
        ]),
      };
      storyRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findActiveStoriesForUser(viewer.id);

      expect(result.map((story) => story.id)).toEqual(['story-1', 'story-2', 'story-3']);
    });

    it('includes public stories from users the viewer does not follow', async () => {
      usersService.findOneById.mockResolvedValue(makeUser({ following: [], followers: [], closeFriendsWith: [] }) as any);
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          makeStory({ user: { id: 'public-owner', storyVisibility: 'public' } }),
        ]),
      };
      storyRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findActiveStoriesForUser('user-1');

      expect(result.map((story) => story.user.id)).toEqual(['public-owner']);
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
