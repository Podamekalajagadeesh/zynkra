import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ReputationService } from '../reputation/reputation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MentionsService } from '../mentions/mentions.service';
import { UsersService } from '../users/users.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { SentimentService } from '../sentiment/sentiment.service';
import { VisibilityService } from '../common/visibility/visibility.service';

function makeUser(overrides: Partial<User> = {}): User {
  const u = new User();
  Object.assign(u, {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    following: [],
    followers: [],
    commentPrivacy: 'everyone',
    ...overrides,
  });
  return u;
}

function makePost(overrides: Partial<Post> = {}): Post {
  const p = new Post();
  Object.assign(p, {
    id: 'post-1',
    content: 'Test post',
    user: makeUser(),
    tags: [],
    ...overrides,
  });
  return p;
}

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<UsersService>;
  let visibilityService: jest.Mocked<VisibilityService>;
  let sentimentService: jest.Mocked<SentimentService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() } },
        { provide: ReputationService, useValue: { addReputation: jest.fn() } },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        { provide: MentionsService, useValue: { createMentions: jest.fn().mockResolvedValue([]) } },
        { provide: UsersService, useValue: { findOneById: jest.fn() } },
        { provide: UserInterestsService, useValue: { recordInteraction: jest.fn() } },
        { provide: SentimentService, useValue: { analyzeSentiment: jest.fn().mockResolvedValue({ sentiment: 'neutral', score: 0, confidence: 0.5 }) } },
        { provide: VisibilityService, useValue: { isBlockedEither: jest.fn().mockResolvedValue(false), getBlockedIdSet: jest.fn().mockResolvedValue(new Set()) } },
        { provide: WebhooksService, useValue: { dispatchEvent: jest.fn() } },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepo = module.get(getRepositoryToken(Comment));
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    visibilityService = module.get(VisibilityService) as jest.Mocked<VisibilityService>;
    sentimentService = module.get(SentimentService) as jest.Mocked<SentimentService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  // ─── create ───────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a comment on a post', async () => {
      const user = makeUser();
      const post = makePost();
      usersService.findOneById.mockResolvedValue(post.user);
      commentsRepo.create.mockReturnValue({} as any);
      commentsRepo.save.mockResolvedValue({ id: 'c1', content: 'Great post!' } as any);

      const result = await service.create('Great post!', user, post);

      expect(result).toBeDefined();
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('creates a reply to a comment', async () => {
      const user = makeUser();
      const post = makePost();
      const parentComment = { id: 'parent-1', isLocked: false } as Comment;
      commentsRepo.findOne.mockResolvedValue(parentComment);
      usersService.findOneById.mockResolvedValue(post.user);
      commentsRepo.create.mockReturnValue({} as any);
      commentsRepo.save.mockResolvedValue({ id: 'reply-1', parent: parentComment } as any);

      const result = await service.create('Reply!', user, post, 'parent-1');

      expect(result).toBeDefined();
    });

    it('throws when replying to a locked comment', async () => {
      commentsRepo.findOne.mockResolvedValue({ id: 'parent-1', isLocked: true } as Comment);

      await expect(service.create('Hack', makeUser(), makePost(), 'parent-1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when blocked by post owner', async () => {
      visibilityService.isBlockedEither.mockResolvedValue(true);
      usersService.findOneById.mockResolvedValue(makeUser({ id: 'owner' }));

      await expect(service.create('Hello', makeUser(), makePost())).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── findByPost ───────────────────────────────────────────────────────

  describe('findByPost', () => {
    it('returns comments for a post', async () => {
      commentsRepo.find.mockResolvedValue([{ id: 'c1', user: makeUser(), replies: [] }]);

      const result = await service.findByPost('post-1');

      expect(result).toHaveLength(1);
    });

    it('filters blocked users when viewer is logged in', async () => {
      const commenter = makeUser({ id: 'blocked-user' });
      commentsRepo.find.mockResolvedValue([{ id: 'c1', user: commenter, replies: [] }]);
      visibilityService.getBlockedIdSet.mockResolvedValue(new Set(['blocked-user']));

      const result = await service.findByPost('post-1', 'viewer-id');

      expect(result).toHaveLength(0);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a comment by id', async () => {
      commentsRepo.findOne.mockResolvedValue({ id: 'c1' });
      const result = await service.findOne('c1');
      expect(result).toBeDefined();
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes own comment', async () => {
      const user = makeUser();
      commentsRepo.findOne.mockResolvedValue({ id: 'c1', user, post: makePost() });

      await service.delete('c1', user);
      expect(commentsRepo.remove).toHaveBeenCalled();
    });

    it('throws when not the owner', async () => {
      const user = makeUser({ id: 'user-1' });
      commentsRepo.findOne.mockResolvedValue({ id: 'c1', user: makeUser({ id: 'other' }), post: makePost({ user: makeUser({ id: 'other' }) }) });

      await expect(service.delete('c1', user)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── togglePin ────────────────────────────────────────────────────────

  describe('togglePin', () => {
    it('pins a comment as post owner', async () => {
      const postOwner = makeUser({ id: 'owner' });
      const post = makePost({ user: postOwner });
      const comment = { id: 'c1', isPinned: false, post } as Comment;
      commentsRepo.findOne.mockResolvedValue(comment);
      commentsRepo.save.mockResolvedValue({ ...comment, isPinned: true });

      const result = await service.togglePin('c1', postOwner);
      expect(result.isPinned).toBe(true);
    });

    it('throws when non-owner tries to pin', async () => {
      const comment = { id: 'c1', post: makePost({ user: makeUser({ id: 'owner' }) }) } as Comment;
      commentsRepo.findOne.mockResolvedValue(comment);

      await expect(service.togglePin('c1', makeUser())).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── toggleLock ───────────────────────────────────────────────────────

  describe('toggleLock', () => {
    it('locks a comment as post owner', async () => {
      const postOwner = makeUser({ id: 'owner' });
      const comment = { id: 'c1', isLocked: false, post: makePost({ user: postOwner }) } as Comment;
      commentsRepo.findOne.mockResolvedValue(comment);
      commentsRepo.save.mockResolvedValue({ ...comment, isLocked: true });

      const result = await service.toggleLock('c1', postOwner);
      expect(result.isLocked).toBe(true);
    });

    it('throws when non-owner tries to lock', async () => {
      const comment = { id: 'c1', post: makePost({ user: makeUser({ id: 'owner' }) }) } as Comment;
      commentsRepo.findOne.mockResolvedValue(comment);

      await expect(service.toggleLock('c1', makeUser())).rejects.toThrow(UnauthorizedException);
    });
  });
});
