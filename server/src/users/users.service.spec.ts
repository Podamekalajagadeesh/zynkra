import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, ProfilePrivacy } from './entities/user.entity';
import { FollowRequest } from './entities/follow-request.entity';
import { Poke } from './entities/poke.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { LifeEvent } from './entities/life-event.entity';

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  Object.assign(user, {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    password_hash: 'hashed',
    bio: 'A test user',
    avatar: '/uploads/avatars/test.jpg',
    emailVerified: true,
    profilePrivacy: ProfilePrivacy.PUBLIC,
    role: 'user' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    following: [],
    followers: [],
    blockedUsers: [],
    restrictedUsers: [],
    closeFriends: [],
    favorites: [],
    ...overrides,
  });
  return user;
}

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let postsRepo: jest.Mocked<Repository<Post>>;
  let followRequestRepo: jest.Mocked<Repository<FollowRequest>>;
  let pokeRepo: jest.Mocked<Repository<Poke>>;
  let lifeEventRepo: jest.Mocked<Repository<LifeEvent>>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FollowRequest),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Poke),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LifeEvent),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn().mockResolvedValue('https://storage.example.com/file.jpg'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    postsRepo = module.get(getRepositoryToken(Post)) as jest.Mocked<Repository<Post>>;
    followRequestRepo = module.get(getRepositoryToken(FollowRequest)) as jest.Mocked<Repository<FollowRequest>>;
    pokeRepo = module.get(getRepositoryToken(Poke)) as jest.Mocked<Repository<Poke>>;
    lifeEventRepo = module.get(getRepositoryToken(LifeEvent)) as jest.Mocked<Repository<LifeEvent>>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  // ─── findOneById ──────────────────────────────────────────────────────

  describe('findOneById', () => {
    it('returns a user when found', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findOneById(user.id);
      expect(result).toBe(user);
    });

    it('returns undefined when not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.findOneById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── findByEmail ──────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('returns a user by email', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');
      expect(result).toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
  });

  // ─── findByUsername ───────────────────────────────────────────────────

  describe('findByUsername', () => {
    it('returns a user by username', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('testuser');
      expect(result).toBe(user);
    });
  });

  // ─── createUser ───────────────────────────────────────────────────────

  describe('createUser', () => {
    it('creates and returns a user', async () => {
      const data = { username: 'newuser', email: 'new@example.com' };
      const created = makeUser({ username: 'newuser', email: 'new@example.com' });
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      const result = await service.createUser(data);
      expect(result).toBe(created);
      expect(usersRepo.create).toHaveBeenCalledWith(data);
      expect(usersRepo.save).toHaveBeenCalledWith(created);
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates user profile fields', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue({ ...user, displayName: 'Updated Name', bio: 'Updated bio' });

      const result = await service.updateProfile(user.id, { displayName: 'Updated Name', bio: 'Updated bio' } as any, null);

      expect(result.displayName).toBe('Updated Name');
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfile('bad-id', {} as any, null)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when username is taken', async () => {
      const user = makeUser();
      const otherUser = makeUser({ id: 'other-id', username: 'taken' });
      usersRepo.findOne.mockResolvedValueOnce(user); // findById
      usersRepo.findOne.mockResolvedValueOnce(otherUser); // check username

      await expect(service.updateProfile(user.id, { username: 'taken' } as any, null)).rejects.toThrow(ConflictException);
    });

    it('allows keeping the same username (no conflict)', async () => {
      const user = makeUser({ username: 'myname' });
      usersRepo.findOne.mockResolvedValue(user); // both findById and findByUsername return same user
      usersRepo.save.mockResolvedValue(user);

      const result = await service.updateProfile(user.id, { username: 'myname' } as any, null);

      expect(result).toBeDefined();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('updates theme fields', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.updateProfile(user.id, {
        profileTheme: 'dark-neon',
        profileThemeColor: '#ff0000',
        profileBioFont: 'Space Grotesk',
      } as any, null);

      expect(user.profileTheme).toBe('dark-neon');
      expect(user.profileThemeColor).toBe('#ff0000');
      expect(user.profileBioFont).toBe('Space Grotesk');
    });

    it('uploads avatar when provided', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      const mockFile = { buffer: Buffer.from('fake-image'), originalname: 'avatar.jpg' };

      const result = await service.updateProfile(user.id, {} as any, mockFile);

      expect(result.avatar).toBeDefined();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates user fields', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue({ ...user, displayName: 'New Name' });

      const result = await service.update(user.id, { displayName: 'New Name' } as any);
      expect(result.displayName).toBe('New Name');
    });

    it('throws NotFoundException for missing user', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new username is taken', async () => {
      const user = makeUser({ username: 'current' });
      const otherUser = makeUser({ id: 'other-id', username: 'taken' });
      usersRepo.findOne.mockResolvedValueOnce(user); // findById
      usersRepo.findOne.mockResolvedValueOnce(otherUser); // check username

      await expect(service.update(user.id, { username: 'taken' } as any)).rejects.toThrow(ConflictException);
    });
  });

  // ─── delete / deactivate ──────────────────────────────────────────────

  describe('delete', () => {
    it('removes the user', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.remove.mockResolvedValue(user);

      await service.delete(user.id);
      expect(usersRepo.remove).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException for missing user', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('sets status to deactivated', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue({ ...user, status: 'deactivated' });

      const result = await service.deactivate(user.id);
      expect(result.status).toBe('deactivated');
    });
  });

  // ─── Follow / Unfollow ────────────────────────────────────────────────

  describe('follow', () => {
    it('follows another user', async () => {
      const follower = makeUser({ following: [] });
      const target = makeUser({ id: 'target-id', username: 'target' });
      // follow() calls findOne 4 times: isBlockedBy(target, follower), isBlockedBy(follower, target), follower, target
      usersRepo.findOne.mockResolvedValueOnce(target);   // isBlockedBy: target not blocking follower
      usersRepo.findOne.mockResolvedValueOnce(follower);  // isBlockedBy: follower not blocking target
      usersRepo.findOne.mockResolvedValueOnce(follower);  // get follower with following
      usersRepo.findOne.mockResolvedValueOnce(target);    // get target

      await service.follow(follower.id, target.id);
      expect(usersRepo.save).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.follow('a', 'b')).rejects.toThrow(NotFoundException);
    });

    it('is idempotent when already following', async () => {
      const target = makeUser({ id: 'target-id' });
      const follower = makeUser({ following: [target] });
      usersRepo.findOne.mockResolvedValueOnce(target);   // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(follower);  // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(follower);  // get follower with following
      usersRepo.findOne.mockResolvedValueOnce(target);    // get target

      await service.follow(follower.id, target.id);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      const follower = makeUser();
      usersRepo.findOne.mockResolvedValueOnce(null);  // isBlockedBy returns null

      await expect(service.follow(follower.id, 'nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when blocked by the target', async () => {
      const follower = makeUser();
      const target = makeUser({
        id: 'target-id',
        blockedUsers: [{ id: follower.id } as any],
      });
      // isBlockedBy(follower, target): loads target with blockedUsers → finds follower
      usersRepo.findOne.mockResolvedValueOnce(target);
      // isBlockedBy(target, follower): loads follower with blockedUsers → empty
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ blockedUsers: [] }));

      await expect(service.follow(follower.id, target.id)).rejects.toThrow(ForbiddenException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when follower has blocked the target', async () => {
      const follower = makeUser();
      const target = makeUser({ id: 'target-id' });
      // isBlockedBy(follower, target): loads target with blockedUsers → empty
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ blockedUsers: [] }));
      // isBlockedBy(target, follower): loads follower with blockedUsers → contains target
      usersRepo.findOne.mockResolvedValueOnce(
        makeUser({ id: follower.id, blockedUsers: [target] }),
      );

      await expect(service.follow(follower.id, target.id)).rejects.toThrow(ForbiddenException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('unfollows a user', async () => {
      const target = makeUser({ id: 'target-id' });
      const follower = makeUser({ following: [target] });
      usersRepo.findOne.mockResolvedValue(follower);

      await service.unfollow(follower.id, target.id);
      expect(follower.following).toHaveLength(0);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('is idempotent when not following', async () => {
      const follower = makeUser({ following: [] });
      usersRepo.findOne.mockResolvedValue(follower);

      await service.unfollow(follower.id, 'someone');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Block / Unblock ──────────────────────────────────────────────────

  describe('block', () => {
    it('blocks a user and removes follow relationships', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ following: [target], followers: [target], blockedUsers: [] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);

      await service.block(user.id, target.id);
      expect(user.blockedUsers).toContain(target);
      expect(user.following).not.toContain(target);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws when blocking yourself', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(user); // same user

      await expect(service.block(user.id, user.id)).rejects.toThrow(BadRequestException);
    });

    it('throws when already blocked', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ blockedUsers: [target] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);

      await expect(service.block(user.id, target.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('unblock', () => {
    it('unblocks a blocked user', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ blockedUsers: [target] });
      usersRepo.findOne.mockResolvedValue(user);

      await service.unblock(user.id, target.id);
      expect(user.blockedUsers).toHaveLength(0);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws when user is not blocked', async () => {
      const user = makeUser({ blockedUsers: [] });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.unblock(user.id, 'someone')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── isBlockedBy ──────────────────────────────────────────────────────

  describe('isBlockedBy', () => {
    it('returns true when blocked', async () => {
      const user = makeUser({ blockedUsers: [makeUser({ id: 'victim-id' })] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.isBlockedBy('victim-id', user.id);
      expect(result).toBe(true);
    });

    it('returns false when not blocked', async () => {
      const user = makeUser({ blockedUsers: [] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.isBlockedBy('victim-id', user.id);
      expect(result).toBe(false);
    });
  });

  // ─── getFollowers ─────────────────────────────────────────────────────

  describe('getFollowers', () => {
    it('returns the followers list', async () => {
      const user = makeUser({ followers: [{ id: 'f1', username: 'alice' }, { id: 'f2', username: 'bob' }] as any });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getFollowers(user.id);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f1');
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getFollowers('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns empty array when user has no followers', async () => {
      const user = makeUser({ followers: [] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getFollowers(user.id);
      expect(result).toHaveLength(0);
    });
  });

  // ─── findOneWithPosts ─────────────────────────────────────────────────

  describe('findOneWithPosts', () => {
    it('returns a user with posts', async () => {
      const user = makeUser({ followers: [] });
      usersRepo.findOne.mockResolvedValue(user);
      postsRepo.find.mockResolvedValue([]);

      const result = await service.findOneWithPosts(user.id, 'viewer-id');
      expect(result).toBe(user);
      expect(result?.posts).toEqual([]);
    });

    it('throws ForbiddenException when blocked', async () => {
      // isBlockedBy(profile-owner, viewer-id) looks up viewer and checks blockedUsers
      const viewerBlocked = makeUser({ id: 'viewer-id', blockedUsers: [makeUser({ id: 'profile-owner' })] });
      usersRepo.findOne.mockResolvedValue(viewerBlocked);

      await expect(service.findOneWithPosts('profile-owner', 'viewer-id')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for private profile when viewer is not a follower', async () => {
      const privateUser = makeUser({
        profilePrivacy: 'private' as any,
        followers: [], // empty followers list
      });
      usersRepo.findOne.mockResolvedValue(privateUser);

      await expect(service.findOneWithPosts(privateUser.id, 'non-follower-id')).rejects.toThrow(ForbiddenException);
    });

    it('returns posts for private profile when viewer IS a follower', async () => {
      const viewer = makeUser({ id: 'viewer-id' });
      const privateUser = makeUser({
        profilePrivacy: 'private' as any,
        followers: [viewer], // viewer is in followers list
      });
      usersRepo.findOne.mockResolvedValue(privateUser);
      postsRepo.find.mockResolvedValue([{ id: 'post-1', content: 'Secret post' }] as any);

      const result = await service.findOneWithPosts(privateUser.id, 'viewer-id');

      expect(result).toBe(privateUser);
      expect((result as any).posts).toHaveLength(1);
    });

    it('returns null when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const result = await service.findOneWithPosts('nonexistent-id', 'viewer-id');
      expect(result).toBeFalsy();
    });
  });

  // ─── search ───────────────────────────────────────────────────────────

  describe('search', () => {
    it('searches users by username or display name', async () => {
      const user = makeUser();
      usersRepo.find.mockResolvedValue([user]);

      const result = await service.search('test');
      expect(result).toHaveLength(1);
      expect(usersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ username: expect.any(Object) }),
            expect.objectContaining({ displayName: expect.any(Object) }),
          ]),
        }),
      );
    });
  });

  // ─── findFollowSuggestions ────────────────────────────────────────────

  describe('findFollowSuggestions', () => {
    it('returns follow suggestions', async () => {
      const user = makeUser({ following: [{ id: 'friend-1' } as User] });
      usersRepo.findOne.mockResolvedValue(user);
      // Mock query builder for friends-of-friends (returns empty → triggers fallback)
      const qb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any;
      usersRepo.createQueryBuilder.mockReturnValue(qb);
      // Fallback find for recent users
      usersRepo.find.mockResolvedValue([makeUser({ id: 'suggestion-1' })]);

      const suggestions = await service.findFollowSuggestions(user.id);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  // ─── Privacy ──────────────────────────────────────────────────────────

  describe('updatePrivacy', () => {
    it('updates privacy settings', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      await service.updatePrivacy(user.id, { postVisibility: 'friends' as any });
      expect(usersRepo.save).toHaveBeenCalled();
    });
  });

  // ─── Life events ──────────────────────────────────────────────────────

  describe('life events', () => {
    it('adds a life event', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      lifeEventRepo.create.mockReturnValue({ id: 'event-1' } as any);
      lifeEventRepo.save.mockResolvedValue({ id: 'event-1' } as any);

      const result = await service.addLifeEvent(user.id, { title: 'New Job', date: '2024-01-01', type: 'work' } as any);
      expect(result).toBeDefined();
    });

    it('removes a life event', async () => {
      lifeEventRepo.delete.mockResolvedValue({ affected: 1, raw: {} } as any);
      await service.removeLifeEvent('event-id');
      expect(lifeEventRepo.delete).toHaveBeenCalledWith('event-id');
    });

    it('throws NotFoundException when removing non-existent event', async () => {
      lifeEventRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);
      await expect(service.removeLifeEvent('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Follow requests ──────────────────────────────────────────────────

  describe('follow requests', () => {
    it('creates a follow request for private profiles', async () => {
      const requester = makeUser();
      const recipient = makeUser({ id: 'recipient-id', profilePrivacy: ProfilePrivacy.PRIVATE });
      usersRepo.findOne.mockResolvedValueOnce(requester);
      usersRepo.findOne.mockResolvedValueOnce(recipient);
      followRequestRepo.findOne.mockResolvedValue(null);
      followRequestRepo.create.mockReturnValue({} as any);
      followRequestRepo.save.mockResolvedValue({} as any);

      await service.createFollowRequest(requester.id, recipient.id);
      expect(followRequestRepo.create).toHaveBeenCalled();
    });

    it('directly follows public profiles instead of creating request', async () => {
      const requester = makeUser({ following: [] });
      const recipient = makeUser({ id: 'recipient-id', profilePrivacy: ProfilePrivacy.PUBLIC });
      // createFollowRequest calls findOne for requester and recipient
      usersRepo.findOne.mockResolvedValueOnce(requester);
      usersRepo.findOne.mockResolvedValueOnce(recipient);
      // then follow() calls isBlockedBy(requester, recipient) → findOne(recipient, blockedUsers)
      usersRepo.findOne.mockResolvedValueOnce(recipient);
      // isBlockedBy(recipient, requester) → findOne(requester, blockedUsers)
      usersRepo.findOne.mockResolvedValueOnce(requester);
      // findOne(requester, following) and findOne(recipient)
      usersRepo.findOne.mockResolvedValueOnce(requester);
      usersRepo.findOne.mockResolvedValueOnce(recipient);

      await service.createFollowRequest(requester.id, recipient.id);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when creating request for missing user', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.createFollowRequest('requester-id', 'missing-id')).rejects.toThrow(NotFoundException);
    });

    it('acceptFollowRequest accepts a valid request', async () => {
      const recipient = makeUser();
      const requester = makeUser({ id: 'requester-id', following: [] });
      const followReq = { id: 'req-1', requester, recipient } as any;
      followRequestRepo.findOne.mockResolvedValue(followReq);
      followRequestRepo.delete.mockResolvedValue({ affected: 1 } as any);

      // follow() is called internally
      usersRepo.findOne.mockResolvedValueOnce(null); // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(null); // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(requester);
      usersRepo.findOne.mockResolvedValueOnce(recipient);

      await service.acceptFollowRequest(recipient.id, 'req-1');
      expect(followRequestRepo.delete).toHaveBeenCalledWith('req-1');
    });

    it('acceptFollowRequest throws NotFoundException for invalid request', async () => {
      followRequestRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptFollowRequest('user-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('acceptFollowRequest throws NotFoundException for wrong recipient', async () => {
      const followReq = { id: 'req-1', recipient: { id: 'other-user' } } as any;
      followRequestRepo.findOne.mockResolvedValue(followReq);
      await expect(service.acceptFollowRequest('user-1', 'req-1')).rejects.toThrow(NotFoundException);
    });

    it('denyFollowRequest deletes the request', async () => {
      const followReq = { id: 'req-1', recipient: { id: 'user-1' } } as any;
      followRequestRepo.findOne.mockResolvedValue(followReq);
      followRequestRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.denyFollowRequest('user-1', 'req-1');
      expect(followRequestRepo.delete).toHaveBeenCalledWith('req-1');
    });

    it('denyFollowRequest throws NotFoundException for invalid request', async () => {
      followRequestRepo.findOne.mockResolvedValue(null);
      await expect(service.denyFollowRequest('user-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findMutualFollows ─────────────────────────────────────────────────

  describe('findMutualFollows', () => {
    it('returns mutual follows between two users', async () => {
      const user1 = makeUser({ following: [{ id: 'a' } as any, { id: 'b' } as any] });
      const user2 = makeUser({ id: 'user-2', following: [{ id: 'b' } as any, { id: 'c' } as any] });
      usersRepo.findOne.mockResolvedValueOnce(user1);
      usersRepo.findOne.mockResolvedValueOnce(user2);

      const result = await service.findMutualFollows(user1.id, 'user-2');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b');
    });

    it('returns empty array when no mutual follows', async () => {
      const user1 = makeUser({ following: [{ id: 'a' } as any] });
      const user2 = makeUser({ id: 'user-2', following: [{ id: 'c' } as any] });
      usersRepo.findOne.mockResolvedValueOnce(user1);
      usersRepo.findOne.mockResolvedValueOnce(user2);

      const result = await service.findMutualFollows(user1.id, 'user-2');
      expect(result).toHaveLength(0);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findMutualFollows('bad-id', 'user-2')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Verification (admin) ─────────────────────────────────────────────

  describe('verification', () => {
    it('verifyUser allows admins to verify', async () => {
      const user = makeUser();
      const admin = makeUser({ id: 'admin-id', role: 'admin' as any });
      usersRepo.findOne.mockResolvedValueOnce(admin);
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.save.mockResolvedValue({ ...user, verified: true });

      const result = await service.verifyUser(user.id, admin.id);
      expect(result.verified).toBe(true);
    });

    it('verifyUser throws ForbiddenException for non-admins', async () => {
      const user = makeUser();
      const nonAdmin = makeUser({ id: 'user-id', role: 'user' as any });
      usersRepo.findOne.mockResolvedValueOnce(nonAdmin);

      await expect(service.verifyUser(user.id, nonAdmin.id)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Close friends ────────────────────────────────────────────────────

  describe('close friends', () => {
    it('gets close friends list', async () => {
      const user = makeUser({ closeFriends: [makeUser({ id: 'friend-1' })] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getCloseFriends(user.id);
      expect(result).toHaveLength(1);
    });

    it('returns empty list when no close friends', async () => {
      const user = makeUser({ closeFriends: [] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getCloseFriends(user.id);
      expect(result).toHaveLength(0);
    });

    it('throws NotFoundException when user not found for getCloseFriends', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getCloseFriends('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('updates close friends', async () => {
      const user = makeUser({ closeFriends: [] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.find.mockResolvedValue([makeUser({ id: 'friend-1' })]);
      usersRepo.save.mockResolvedValue({ ...user, closeFriends: [makeUser({ id: 'friend-1' })] });

      const result = await service.updateCloseFriends(user.id, ['friend-1']);
      expect(result.closeFriends).toHaveLength(1);
    });

    it('updates close friends to empty list', async () => {
      const user = makeUser({ closeFriends: [makeUser({ id: 'friend-1' })] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.find.mockResolvedValue([]);
      usersRepo.save.mockResolvedValue({ ...user, closeFriends: [] });

      const result = await service.updateCloseFriends(user.id, []);
      expect(result.closeFriends).toHaveLength(0);
    });
  });

  // ─── Pokes ────────────────────────────────────────────────────────────

  describe('pokes', () => {
    it('throws when poking yourself', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.pokeUser(user.id, user.id)).rejects.toThrow(BadRequestException);
    });

    it('sends a poke to another user', async () => {
      const sender = makeUser();
      const receiver = makeUser({ id: 'receiver-id' });
      usersRepo.findOne.mockResolvedValueOnce(sender);
      usersRepo.findOne.mockResolvedValueOnce(receiver);
      pokeRepo.create.mockReturnValue({ id: 'poke-1' } as any);
      pokeRepo.save.mockResolvedValue({ id: 'poke-1' } as any);

      const result = await service.pokeUser(sender.id, receiver.id);
      expect(result).toBeDefined();
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });
  });

  // ─── getFollowing ─────────────────────────────────────────────────────

  describe('getFollowing', () => {
    it('returns users the current user follows', async () => {
      const following = [makeUser({ id: 'friend-1' }), makeUser({ id: 'friend-2' })];
      const user = makeUser({ following: following as any });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getFollowing(user.id);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('friend-1');
    });

    it('returns empty array when not following anyone', async () => {
      const user = makeUser({ following: [] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getFollowing(user.id);
      expect(result).toHaveLength(0);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getFollowing('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findFollowingIds ─────────────────────────────────────────────────

  describe('findFollowingIds', () => {
    it('returns IDs of users the current user follows', async () => {
      const following = [{ id: 'friend-1' }, { id: 'friend-2' }] as any;
      const user = makeUser({ following });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findFollowingIds(user.id);
      expect(result).toEqual(['friend-1', 'friend-2']);
    });

    it('returns empty array when not following anyone', async () => {
      const user = makeUser({ following: [] });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findFollowingIds(user.id);
      expect(result).toHaveLength(0);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.findFollowingIds('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPendingFollowRequests ─────────────────────────────────────────

  describe('getPendingFollowRequests', () => {
    it('returns pending follow requests for the user', async () => {
      const requester = makeUser({ id: 'requester-id', username: 'requester' });
      const pendingRequests = [
        { id: 'req-1', requester, status: 'pending' } as any,
      ];
      followRequestRepo.find.mockResolvedValue(pendingRequests);

      const result = await service.getPendingFollowRequests('user-id');
      expect(result).toHaveLength(1);
      expect(result[0].requester.id).toBe('requester-id');
    });

    it('returns empty array when no pending requests', async () => {
      followRequestRepo.find.mockResolvedValue([]);

      const result = await service.getPendingFollowRequests('user-id');
      expect(result).toHaveLength(0);
    });
  });

  // ─── cancelFollowRequest ──────────────────────────────────────────────

  describe('cancelFollowRequest', () => {
    it('deletes the follow request when owned by the requester', async () => {
      const followReq = { id: 'req-1', requester: { id: 'requester-id' } } as any;
      followRequestRepo.findOne.mockResolvedValue(followReq);
      followRequestRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.cancelFollowRequest('requester-id', 'req-1');

      expect(followRequestRepo.delete).toHaveBeenCalledWith('req-1');
    });

    it('throws NotFoundException when request does not exist', async () => {
      followRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelFollowRequest('requester-id', 'req-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when request belongs to another user', async () => {
      // The findOne query uses { where: { id, requester: { id: requesterId } } },
      // so a request owned by another user returns null from the mock
      followRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelFollowRequest('requester-id', 'req-1')).rejects.toThrow(NotFoundException);
    });
  });
});
