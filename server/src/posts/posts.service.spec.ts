import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostsService } from './posts.service';
import { Post, PostVisibility } from './entities/post.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { WalletService } from '../wallet/wallet.service';
import { TokenGatedContentService } from '../token-gated-content/token-gated-content.service';
import { ReputationService } from '../reputation/reputation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrendsService } from '../trends/trends.service';
import { MentionsService } from '../mentions/mentions.service';
import { TagsService } from '../tags/tags.service';
import { UserInterestsService } from '../user-interests/user-interests.service';
import { GroupsService } from '../groups/groups.service';
import { TimelineReviewService } from '../timeline-review/timeline-review.service';
import { ProfileReviewService } from '../tags/profile-review.service';
import { VisibilityService } from '../common/visibility/visibility.service';
import { Comment } from '../comments/entities/comment.entity';
import { Report } from '../reports/entities/report.entity';
import { Media } from '../media/entities/media.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Poll } from '../polls/entities/poll.entity';
import { PollOption } from '../polls/entities/poll-option.entity';
import { ReelEffect } from '../reels/entities/reel-effect.entity';
import { TimelineReview } from '../timeline-review/entities/timeline-review.entity';
import { User } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  Object.assign(user, {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    ...overrides,
  });
  return user;
}

function makePost(overrides: Partial<Post> = {}): Post {
  const post = new Post();
  Object.assign(post, {
    id: 'post-id',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    isPinned: false,
    user: makeUser(),
    tags: [],
    likes: [],
    comments: [],
    viewCount: 0,
    likeCount: 0,
    shareCount: 0,
    repostCount: 0,
    quoteCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return post;
}

describe('PostsService', () => {
  let service: PostsService;
  let postsRepo: jest.Mocked<Repository<Post>>;
  let postReactionsRepo: jest.Mocked<Repository<PostReaction>>;
  let commentsRepo: jest.Mocked<Repository<Comment>>;
  let usersService: jest.Mocked<UsersService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let visibilityService: jest.Mocked<VisibilityService>;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), delete: jest.fn(), increment: jest.fn(), count: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(PostReaction), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn(), delete: jest.fn(), count: jest.fn() } },
        { provide: getRepositoryToken(Comment), useValue: { delete: jest.fn(), count: jest.fn() } },
        { provide: getRepositoryToken(Report), useValue: { delete: jest.fn() } },
        { provide: getRepositoryToken(Poll), useValue: {} },
        { provide: getRepositoryToken(PollOption), useValue: {} },
        { provide: getRepositoryToken(Media), useValue: {} },
        { provide: getRepositoryToken(ReelEffect), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(TimelineReview), useValue: {} },
        { provide: getRepositoryToken(Subscription), useValue: { find: jest.fn() } },
        { provide: UsersService, useValue: { findOneById: jest.fn() } },
        { provide: StorageService, useValue: { upload: jest.fn() } },
        { provide: WalletService, useValue: {} },
        { provide: TokenGatedContentService, useValue: { hasAccess: jest.fn().mockResolvedValue(true) } },
        { provide: ReputationService, useValue: { addReputation: jest.fn() } },
        { provide: HttpService, useValue: {} },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        { provide: TrendsService, useValue: { extractAndScoreHashtags: jest.fn() } },
        { provide: MentionsService, useValue: { createMentions: jest.fn().mockResolvedValue([]) } },
        { provide: TagsService, useValue: { parseAndCreateTags: jest.fn().mockResolvedValue([]), findPostsByTagName: jest.fn().mockResolvedValue([]) } },
        { provide: UserInterestsService, useValue: { recordInteraction: jest.fn() } },
        { provide: GroupsService, useValue: { getGroupById: jest.fn() } },
        { provide: TimelineReviewService, useValue: {} },
        { provide: ProfileReviewService, useValue: { createForPost: jest.fn() } },
        { provide: VisibilityService, useValue: { filterVisiblePosts: jest.fn().mockImplementation((_uid, posts) => posts), isBlockedEither: jest.fn().mockResolvedValue(false), canViewAuthor: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postsRepo = module.get(getRepositoryToken(Post)) as jest.Mocked<Repository<Post>>;
    postReactionsRepo = module.get(getRepositoryToken(PostReaction)) as jest.Mocked<Repository<PostReaction>>;
    commentsRepo = module.get(getRepositoryToken(Comment)) as jest.Mocked<Repository<Comment>>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    visibilityService = module.get(VisibilityService) as jest.Mocked<VisibilityService>;
    tagsService = module.get(TagsService) as jest.Mocked<TagsService>;
  });

  // ─── create ───────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a text post', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      const saved = makePost({ content: 'Hello world' });
      postsRepo.save.mockResolvedValue(saved);

      const result = await service.create({ userId: user.id }, { content: 'Hello world' });

      expect(result.content).toBe('Hello world');
      expect(postsRepo.save).toHaveBeenCalled();
    });

    it('creates a post with media', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      const saved = makePost({ content: 'With media' });
      postsRepo.save.mockResolvedValue(saved);

      const result = await service.create(
        { userId: user.id },
        { content: 'With media', media: [{ url: 'https://example.com/img.jpg', type: 'image' }] },
      );

      expect(result.content).toBe('With media');
    });

    it('creates a post with multiple images', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'Gallery' }));

      const media = [
        { url: 'https://cdn.example.com/1.jpg', type: 'image', altText: 'First' },
        { url: 'https://cdn.example.com/2.jpg', type: 'image', altText: 'Second' },
        { url: 'https://cdn.example.com/3.jpg', type: 'image', altText: 'Third' },
      ];

      await service.create(
        { userId: user.id },
        { content: 'Gallery', media },
      );

      expect(postsRepo.save).toHaveBeenCalled();
      const savedPost = postsRepo.save.mock.calls[0][0];
      expect(savedPost.media).toHaveLength(3);
      expect(savedPost.media[0].url).toBe('https://cdn.example.com/1.jpg');
      expect(savedPost.media[0].type).toBe('image');
    });

    it('creates a post with no media (text only)', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'Text only' }));

      const result = await service.create(
        { userId: user.id },
        { content: 'Text only' },
      );

      expect(result.content).toBe('Text only');
      expect(postsRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException for encrypted post without encryptedContent', async () => {
      usersService.findOneById.mockResolvedValue(makeUser());

      await expect(
        service.create({ userId: 'u1' }, { content: 'secret', isEncrypted: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws Error when user not found', async () => {
      usersService.findOneById.mockResolvedValue(null);

      await expect(
        service.create({ userId: 'bad-id' }, { content: 'Hello' }),
      ).rejects.toThrow();
    });

    it('creates a post with visibility setting', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      const saved = makePost({ content: 'Friends only' });
      postsRepo.save.mockResolvedValue(saved);

      const result = await service.create(
        { userId: user.id },
        { content: 'Friends only', visibility: 'friends' as any },
      );

      expect(result.content).toBe('Friends only');
    });

    it('creates a post with poll data', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'Vote!' }));

      const result = await service.create(
        { userId: user.id },
        { content: 'Vote!', poll: { question: 'Fav color?', options: [{ text: 'Blue' }, { text: 'Red' }] } },
      );

      expect(result.content).toBe('Vote!');
      expect(postsRepo.save).toHaveBeenCalled();
      const savedPost = postsRepo.save.mock.calls[0][0];
      expect(savedPost.poll).toBeDefined();
      expect(savedPost.poll).toHaveLength(1);
      expect(savedPost.poll[0].question).toBe('Fav color?');
      expect(savedPost.poll[0].options).toHaveLength(2);
      expect(savedPost.poll[0].options[0].text).toBe('Blue');
      expect(savedPost.poll[0].options[1].text).toBe('Red');
    });

    it('creates a post without poll data', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'No poll' }));

      const result = await service.create(
        { userId: user.id },
        { content: 'No poll' },
      );

      expect(result.content).toBe('No poll');
      const savedPost = postsRepo.save.mock.calls[0][0];
      expect(savedPost.poll).toBeUndefined();
    });

    it('creates a post with empty poll options', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'Empty poll' }));

      const result = await service.create(
        { userId: user.id },
        { content: 'Empty poll', poll: { question: 'Any?', options: [] } },
      );

      expect(result.content).toBe('Empty poll');
      const savedPost = postsRepo.save.mock.calls[0][0];
      expect(savedPost.poll).toBeDefined();
      expect(savedPost.poll).toHaveLength(1);
      expect(savedPost.poll[0].question).toBe('Any?');
      expect(savedPost.poll[0].options).toHaveLength(0);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a post by id', async () => {
      const post = makePost();
      postsRepo.findOne.mockResolvedValue(post);

      const result = await service.findOne('post-id');
      expect(result).toBe(post);
    });

    it('returns undefined when not found', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne('bad-id');
      expect(result).toBeUndefined();
    });

    it('throws NotFoundException when blocked', async () => {
      const post = makePost({ user: makeUser({ id: 'owner-id' }) });
      postsRepo.findOne.mockResolvedValue(post);
      visibilityService.isBlockedEither.mockResolvedValue(true);

      await expect(service.findOne('post-id', 'viewer-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns posts for a logged-in user', async () => {
      const user = makeUser({ following: [] });
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.find.mockResolvedValue([makePost()]);

      const result = await service.findAll('user-id');
      expect(result).toHaveLength(1);
    });

    it('returns public posts for logged-out users', async () => {
      postsRepo.find.mockResolvedValue([makePost()]);

      const result = await service.findAll(undefined);
      expect(result).toHaveLength(1);
    });
  });

  // ─── like / unlike ────────────────────────────────────────────────────

  describe('like', () => {
    it('likes a post', async () => {
      const user = makeUser();
      const post = makePost();
      postsRepo.findOne.mockResolvedValueOnce(post); // findOne
      postsRepo.findOne.mockResolvedValueOnce(post); // and during findOne, token check
      usersService.findOneById.mockResolvedValue(user);
      postReactionsRepo.findOne.mockResolvedValue(null);
      postReactionsRepo.create.mockReturnValue({} as any);
      postReactionsRepo.save.mockResolvedValue({} as any);

      await service.like('post-id', { userId: user.id });
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('is idempotent when already liked', async () => {
      const user = makeUser();
      const post = makePost();
      postsRepo.findOne.mockResolvedValue(post);
      usersService.findOneById.mockResolvedValue(user);
      postReactionsRepo.findOne.mockResolvedValue({ id: 'existing' } as any);

      await service.like('post-id', { userId: user.id });
      expect(postReactionsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('unlike', () => {
    it('removes a like', async () => {
      const user = makeUser();
      const post = makePost();
      postsRepo.findOne.mockResolvedValue(post);
      usersService.findOneById.mockResolvedValue(user);
      const reaction = { id: 'reaction-1' } as any;
      postReactionsRepo.findOne.mockResolvedValue(reaction);

      await service.unlike('post-id', { userId: user.id });
      expect(postReactionsRepo.remove).toHaveBeenCalledWith(reaction);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates post content when owner', async () => {
      const user = makeUser();
      const post = makePost({ user });
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.save.mockResolvedValue({ ...post, content: 'Updated content' });

      const result = await service.update('post-id', 'Updated content', { userId: user.id });
      expect(result.content).toBe('Updated content');
    });

    it('throws when non-owner tries to update', async () => {
      const owner = makeUser({ id: 'owner-id' });
      const post = makePost({ user: owner });
      postsRepo.findOne.mockResolvedValue(post);

      await expect(service.update('post-id', 'hacked', { userId: 'other-id' })).rejects.toThrow('not authorized');
    });

    it('throws when post not found', async () => {
      postsRepo.findOne.mockResolvedValue(null);
      await expect(service.update('missing', 'Updated', { userId: 'user-1' })).rejects.toThrow();
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes own post', async () => {
      const user = makeUser();
      const post = makePost({ user });
      postsRepo.findOne.mockResolvedValue(post);

      await service.remove('post-id', { userId: user.id });
      expect(postsRepo.remove).toHaveBeenCalled();
    });

    it('allows admin to delete any post', async () => {
      const post = makePost({ user: makeUser({ id: 'owner-id' }) });
      postsRepo.findOne.mockResolvedValue(post);

      await service.remove('post-id', { userId: 'admin-id', role: 'admin' });
      expect(postsRepo.remove).toHaveBeenCalled();
    });

    it('throws when non-owner non-admin tries to delete', async () => {
      const owner = makeUser({ id: 'owner-id' });
      const post = makePost({ user: owner });
      postsRepo.findOne.mockResolvedValue(post);

      await expect(service.remove('post-id', { userId: 'other-id' })).rejects.toThrow('not authorized');
    });

    it('throws when post not found', async () => {
      postsRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing', { userId: 'user-1' })).rejects.toThrow();
    });
  });

  // ─── share ────────────────────────────────────────────────────────────

  describe('share', () => {
    it('increments share count and notifies', async () => {
      const user = makeUser();
      const post = makePost({ user: makeUser({ id: 'author-id' }) });
      postsRepo.findOne.mockResolvedValue(post);
      usersService.findOneById.mockResolvedValue(user);

      await service.share('post-id', { userId: user.id });
      expect(postsRepo.increment).toHaveBeenCalledWith({ id: 'post-id' }, 'shareCount', 1);
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });
  });

  // ─── repost / undoRepost ──────────────────────────────────────────────

  describe('repost', () => {
    it('creates a repost', async () => {
      const user = makeUser();
      const original = makePost();
      postsRepo.findOne.mockResolvedValueOnce(original); // findOne
      postsRepo.findOne.mockResolvedValueOnce(original); // visible during findOne
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.findOne.mockResolvedValueOnce(null); // no existing repost
      postsRepo.create.mockReturnValue({} as any);
      postsRepo.save.mockResolvedValue({} as any);

      const result = await service.repost('post-id', { userId: user.id });
      expect(result).toBe(original);
    });
  });

  describe('undoRepost', () => {
    it('removes a repost', async () => {
      const user = makeUser();
      const original = makePost();
      const repost = { id: 'repost-id' } as any;
      // undoRepost calls findOne(original) → find repost → remove repost
      postsRepo.findOne.mockResolvedValueOnce(original); // findOne(original)
      postsRepo.findOne.mockResolvedValueOnce(original); // findOne inside visibility check
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.findOne.mockResolvedValueOnce(repost);   // find existing repost

      await service.undoRepost('post-id', { userId: user.id });
      expect(postsRepo.remove).toHaveBeenCalled();
    });
  });

  // ─── togglePin ────────────────────────────────────────────────────────

  describe('togglePin', () => {
    it('pins a post (max 6)', async () => {
      const user = makeUser();
      const post = makePost({ user, isPinned: false });
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.count.mockResolvedValue(0);
      postsRepo.save.mockResolvedValue({ ...post, isPinned: true } as Post);

      const result = await service.togglePin('post-id', user.id);
      expect(result.isPinned).toBe(true);
    });

    it('unpins a pinned post', async () => {
      const user = makeUser();
      const post = makePost({ user, isPinned: true });
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.save.mockResolvedValue({ ...post, isPinned: false } as Post);

      const result = await service.togglePin('post-id', user.id);
      expect(result.isPinned).toBe(false);
    });

    it('throws when non-owner tries to pin', async () => {
      const owner = makeUser({ id: 'owner-id' });
      const post = makePost({ user: owner });
      postsRepo.findOne.mockResolvedValue(post);

      await expect(service.togglePin('post-id', 'other-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── archive (IPFS) ───────────────────────────────────────────────────

  describe('archive', () => {
    it('archives a post to IPFS', async () => {
      const user = makeUser();
      const post = makePost({ user, ipfsCid: null });
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.save.mockResolvedValue({ ...post, ipfsCid: 'QmHash' });

      const result = await service.archive('post-id', user.id);
      expect(result.ipfsCid).toBe('QmHash');
    });

    it('throws when non-owner archives', async () => {
      const owner = makeUser({ id: 'owner-id' });
      const post = makePost({ user: owner });
      postsRepo.findOne.mockResolvedValue(post);

      await expect(service.archive('post-id', 'other-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── feature / unfeature ──────────────────────────────────────────────

  describe('feature', () => {
    it('features own post', async () => {
      const user = makeUser();
      const post = makePost({ user, isFeatured: false });
      postsRepo.findOne.mockResolvedValue(post);

      await service.feature('post-id', { userId: user.id });
      expect(postsRepo.save).toHaveBeenCalled();
    });

    it('throws when non-owner features', async () => {
      const post = makePost({ user: makeUser({ id: 'owner-id' }) });
      postsRepo.findOne.mockResolvedValue(post);

      await expect(service.feature('post-id', { userId: 'other-id' })).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── drafts ───────────────────────────────────────────────────────────

  describe('drafts', () => {
    it('creates a draft marked isDraft', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      const draft = makePost({ content: 'work in progress', isDraft: true });
      postsRepo.create.mockReturnValue(draft);
      postsRepo.save.mockResolvedValue(draft);

      const result = await service.createDraft(user.id, { content: 'work in progress' });

      expect(result.isDraft).toBe(true);
      expect(postsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'work in progress', isDraft: true }),
      );
    });

    it('lists only the user’s drafts', async () => {
      postsRepo.find.mockResolvedValue([makePost({ isDraft: true })]);

      await service.findDrafts('user-id');

      expect(postsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { id: 'user-id' }, isDraft: true } }),
      );
    });

    it('throws NotFoundException for a missing draft', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      await expect(service.findDraft('user-id', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('updates draft content', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ isDraft: true }));
      postsRepo.save.mockResolvedValue(makePost({ content: 'edited', isDraft: true }));

      const result = await service.updateDraft('user-id', 'draft-id', { content: 'edited' });

      expect(result.content).toBe('edited');
      expect(postsRepo.save).toHaveBeenCalled();
    });

    it('publishes a draft through the full pipeline and removes the draft', async () => {
      const user = makeUser();
      postsRepo.findOne.mockResolvedValue(makePost({ content: 'ready', isDraft: true, user }));
      usersService.findOneById.mockResolvedValue(user);
      postsRepo.save.mockResolvedValue(makePost({ content: 'ready' }));
      postsRepo.remove.mockResolvedValue(makePost());

      const result = await service.publishDraft(user.id, 'draft-id');

      expect(postsRepo.remove).toHaveBeenCalled();
      expect(result.content).toBe('ready');
    });

    it('deletes a draft', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ isDraft: true }));
      postsRepo.remove.mockResolvedValue(makePost());

      await service.deleteDraft('user-id', 'draft-id');

      expect(postsRepo.remove).toHaveBeenCalled();
    });
  });

  // ─── collaborators ─────────────────────────────────────────────────────

  describe('collaborators', () => {
    it('sets collaborators for the post author', async () => {
      const author = makeUser();
      postsRepo.findOne.mockResolvedValue(makePost({ user: author }));
      usersService.findOneById.mockResolvedValue(makeUser({ id: 'collab-1' }));
      const saved = makePost({ user: author });
      saved.collaborators = [makeUser({ id: 'collab-1' })];
      postsRepo.save.mockResolvedValue(saved);
      postsRepo.findOne.mockResolvedValue(makePost({ user: author, collaborators: [makeUser({ id: 'collab-1' })] }));

      const result = await service.setCollaborators('post-id', author.id, { userIds: ['collab-1'] });

      expect(usersService.findOneById).toHaveBeenCalledWith('collab-1');
      expect(postsRepo.save).toHaveBeenCalled();
      expect(result.collaborators).toHaveLength(1);
    });

    it('forbids non-authors from setting collaborators', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ user: makeUser({ id: 'owner-id' }) }));

      await expect(
        service.setCollaborators('post-id', 'other-id', { userIds: ['collab-1'] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when a collaborator does not exist', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ user: makeUser() }));
      usersService.findOneById.mockResolvedValue(null);

      await expect(
        service.setCollaborators('post-id', makeUser().id, { userIds: ['ghost'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── per-post analytics ────────────────────────────────────────────────

  describe('getPostAnalytics', () => {
    it('returns aggregate stats for the owner', async () => {
      const author = makeUser();
      postsRepo.findOne.mockResolvedValue(makePost({ user: author, viewCount: 100, shareCount: 4, quoteCount: 2, repostCount: 1 }));
      postReactionsRepo.count.mockResolvedValue(10);
      commentsRepo.count.mockResolvedValue(5);

      const result = await service.getPostAnalytics(author.id, 'post-id');

      expect(result).toEqual(
        expect.objectContaining({
          postId: 'post-id',
          views: 100,
          reactions: 10,
          comments: 5,
          shares: 4,
          quotes: 2,
          reposts: 1,
          engagements: 22,
        }),
      );
    });

    it('forbids non-owners', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ user: makeUser({ id: 'owner-id' }) }));

      await expect(service.getPostAnalytics('other-id', 'post-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the post is missing', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      await expect(service.getPostAnalytics('user-id', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── more-like-this ────────────────────────────────────────────────────

  describe('findSimilarPosts', () => {
    it('throws NotFoundException when the post is missing', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      await expect(service.findSimilarPosts('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('falls back to recent public posts when the post has no tags', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ tags: [] }));
      postsRepo.find.mockResolvedValue([makePost({ id: 'other', content: 'Recent' })]);

      const result = await service.findSimilarPosts('post-id');

      expect(result).toHaveLength(1);
      expect(postsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { visibility: PostVisibility.PUBLIC, isDraft: false } }),
      );
    });

    it('ranks candidates by shared-tag overlap', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ tags: [{ id: 'tag-a' }] as any }));
      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          makePost({ id: 'p-1', content: 'two matches' }),
          makePost({ id: 'p-1', content: 'two matches' }),
          makePost({ id: 'p-2', content: 'one match' }),
        ]),
      };
      postsRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findSimilarPosts('post-id', 5);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p-1');
      expect(result[1].id).toBe('p-2');
    });
  });

  // ─── oEmbed ────────────────────────────────────────────────────────────

  describe('getOEmbed', () => {
    it('returns an oEmbed response with an iframe', async () => {
      postsRepo.findOne.mockResolvedValue(makePost({ content: 'Hello embed', user: makeUser({ username: 'jsh' }) }));

      const result = await service.getOEmbed('post-id');

      expect(result.type).toBe('rich');
      expect(result.title).toBe('Hello embed');
      expect(result.author_name).toBe('jsh');
      expect(result.html).toContain('iframe');
      expect(result.html).toContain('/embed/post/post-id');
    });

    it('throws NotFoundException when the post is missing', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      await expect(service.getOEmbed('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
