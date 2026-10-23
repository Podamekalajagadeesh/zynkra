import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoriesReplyService } from './stories-reply.service';
import { StoryReply } from './entities/story-reply.entity';
import { Story } from './entities/story.entity';
import { StoriesService } from './stories.service';

describe('StoriesReplyService', () => {
  let service: StoriesReplyService;
  let replyRepo: jest.Mocked<Repository<StoryReply>>;
  let storyRepo: jest.Mocked<Repository<Story>>;
  let storiesService: jest.Mocked<StoriesService>;

  const makeStory = (ownerId = 'owner-1') =>
    ({ id: 'story-1', user: { id: ownerId, username: 'owner' } }) as any;

  const makeReply = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'reply-1',
      text: 'Nice!',
      user: { id: 'viewer-1', username: 'viewer' },
      story: makeStory(),
      ...overrides,
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesReplyService,
        {
          provide: getRepositoryToken(StoryReply),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        { provide: getRepositoryToken(Story), useValue: { findOne: jest.fn() } },
        { provide: StoriesService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(StoriesReplyService);
    replyRepo = module.get(getRepositoryToken(StoryReply));
    storyRepo = module.get(getRepositoryToken(Story));
    storiesService = module.get(StoriesService);
  });

  describe('addReply', () => {
    it('saves a reply for a visible story with the sender stub', async () => {
      storiesService.findOne.mockResolvedValue(makeStory() as any);
      replyRepo.create.mockImplementation((data) => ({ id: 'reply-1', ...data }) as any);
      replyRepo.save.mockImplementation(async (reply) => reply as any);

      const result = await service.addReply('viewer-1', 'story-1', 'Nice!');

      expect(result.id).toBe('reply-1');
      expect(replyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Nice!',
          user: expect.objectContaining({ id: 'viewer-1' }),
        })
      );
      expect(storiesService.findOne).toHaveBeenCalledWith('story-1', 'viewer-1');
    });

    it('throws NotFoundException when the story is not visible', async () => {
      storiesService.findOne.mockResolvedValue(null);

      await expect(service.addReply('viewer-1', 'missing', 'hi')).rejects.toThrow(
        NotFoundException
      );
      expect(replyRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getReplies', () => {
    it('returns the paginated envelope with newest-first sender-loaded rows', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory('owner-1'));
      replyRepo.findAndCount.mockResolvedValue([[makeReply()], 1]);

      const result = await service.getReplies('story-1', 'owner-1', 1, 20);

      expect(result).toEqual({
        data: [expect.objectContaining({ id: 'reply-1' })],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(storyRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        relations: ['user'],
      });
      expect(replyRepo.findAndCount).toHaveBeenCalledWith({
        where: { story: { id: 'story-1' } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('computes skip/take and totalPages from the requested page', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory('owner-1'));
      replyRepo.findAndCount.mockResolvedValue([[makeReply({ id: 'reply-3' })], 5]);

      const result = await service.getReplies('story-1', 'owner-1', 2, 2);

      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
      expect(replyRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2, take: 2 })
      );
    });

    it('defaults to page 1 / limit 20 when no paging args are given', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory('owner-1'));
      replyRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getReplies('story-1', 'owner-1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(0);
      expect(replyRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });

    it('throws NotFoundException when the story does not exist', async () => {
      storyRepo.findOne.mockResolvedValue(null);

      await expect(service.getReplies('missing', 'owner-1')).rejects.toThrow(NotFoundException);
      expect(replyRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for a non-owner (even a visible-story viewer)', async () => {
      storyRepo.findOne.mockResolvedValue(makeStory('owner-1'));

      await expect(service.getReplies('story-1', 'someone-else')).rejects.toThrow(
        UnauthorizedException
      );
      expect(replyRepo.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('deleteReply', () => {
    it('lets the reply author delete their own reply', async () => {
      replyRepo.findOne.mockResolvedValue(makeReply());
      replyRepo.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.deleteReply('story-1', 'reply-1', 'viewer-1');

      expect(replyRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'reply-1', story: { id: 'story-1' } },
        relations: ['user', 'story', 'story.user'],
      });
      expect(replyRepo.delete).toHaveBeenCalledWith('reply-1');
    });

    it('lets the story owner moderate a reply they did not write', async () => {
      replyRepo.findOne.mockResolvedValue(makeReply());
      replyRepo.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.deleteReply('story-1', 'reply-1', 'owner-1');

      expect(replyRepo.delete).toHaveBeenCalledWith('reply-1');
    });

    it('throws NotFoundException when the reply is missing or belongs to another story', async () => {
      replyRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteReply('story-1', 'other-reply', 'owner-1')).rejects.toThrow(
        NotFoundException
      );
      expect(replyRepo.delete).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for a stranger touching someone else’s reply', async () => {
      replyRepo.findOne.mockResolvedValue(makeReply());

      await expect(service.deleteReply('story-1', 'reply-1', 'stranger-1')).rejects.toThrow(
        UnauthorizedException
      );
      expect(replyRepo.delete).not.toHaveBeenCalled();
    });
  });
});
