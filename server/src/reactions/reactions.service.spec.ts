import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReactionsService } from './reactions.service';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { WebhooksService } from '../webhooks/webhooks.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let postReactionsRepo: jest.Mocked<any>;
  let postsService: jest.Mocked<PostsService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: getRepositoryToken(PostReaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: PostsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn().mockResolvedValue({ id: 'user-1' }) },
        },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: WebhooksService,
          useValue: { dispatchEvent: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
    postReactionsRepo = module.get(getRepositoryToken(PostReaction));
    postsService = module.get(PostsService) as jest.Mocked<PostsService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  describe('addReaction', () => {
    it('adds a reaction to a post', async () => {
      postsService.findOne.mockResolvedValue({ id: 'post-1' } as Post);
      postReactionsRepo.findOne.mockResolvedValue(null);
      postReactionsRepo.create.mockReturnValue({ id: 'reaction-1', reaction: 'love' });
      postReactionsRepo.save.mockResolvedValue({ id: 'reaction-1', reaction: 'love' });

      const result = await service.addReaction('user-1', 'post-1', 'love');

      expect(result.reaction).toBe('love');
      expect(postReactionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reaction: 'love' })
      );
    });

    it('removes reaction if already exists (toggle)', async () => {
      postsService.findOne.mockResolvedValue({ id: 'post-1' } as Post);
      const existing = { id: 'existing-1', reaction: 'like' } as PostReaction;
      postReactionsRepo.findOne.mockResolvedValue(existing);

      const result = await service.addReaction('user-1', 'post-1', 'like');

      expect(postReactionsRepo.remove).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
    });

    it('supports multiple reaction types on same post', async () => {
      postsService.findOne.mockResolvedValue({ id: 'post-1' } as Post);
      // User has 'like' but is adding 'love' — should add, not remove
      postReactionsRepo.findOne.mockResolvedValue(null);
      postReactionsRepo.create.mockReturnValue({ id: 'new', reaction: 'love' });
      postReactionsRepo.save.mockResolvedValue({ id: 'new', reaction: 'love' });

      const result = await service.addReaction('user-1', 'post-1', 'love');

      expect(postReactionsRepo.save).toHaveBeenCalled();
      expect(result.reaction).toBe('love');
    });

    it('throws NotFoundException when post does not exist', async () => {
      postsService.findOne.mockResolvedValue(undefined);

      await expect(service.addReaction('user-1', 'bad-id', 'like')).rejects.toThrow(
        NotFoundException
      );
    });

    it('checks visibility as the reacting user and notifies the post author', async () => {
      postsService.findOne.mockResolvedValue({
        id: 'post-1',
        user: { id: 'author-1' },
      } as any);
      postReactionsRepo.findOne.mockResolvedValue(null);
      postReactionsRepo.create.mockReturnValue({ id: 'reaction-1' } as any);
      postReactionsRepo.save.mockResolvedValue({ id: 'reaction-1' } as any);

      await service.addReaction('user-1', 'post-1', 'like');

      expect(postsService.findOne).toHaveBeenCalledWith('post-1', 'user-1');
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        { id: 'author-1' },
        NotificationType.LIKE,
        { userId: 'user-1', postId: 'post-1' }
      );
    });

    it('rejects unsupported reaction types', async () => {
      await expect(service.addReaction('user-1', 'post-1', 'rocket')).rejects.toThrow(
        BadRequestException
      );
    });

    it('handles common reaction types', async () => {
      postsService.findOne.mockResolvedValue({ id: 'post-1' } as Post);
      postReactionsRepo.findOne.mockResolvedValue(null);
      postReactionsRepo.create.mockReturnValue({} as any);
      postReactionsRepo.save.mockResolvedValue({} as any);

      for (const type of ['like', 'love', 'haha', 'wow', 'sad', 'angry']) {
        await service.addReaction('user-1', 'post-1', type);
        expect(postReactionsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ reaction: type })
        );
      }
    });
  });
});
