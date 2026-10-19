import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  UsersService,
  toPublicUserResponse,
  toSelfUserResponse,
  toSearchUserResponse,
} from './users.service';
import { User, ProfilePrivacy } from './entities/user.entity';
import { Role } from './roles.enum';
import { DataPermission } from '../features/account-management/dto/data-permissions.dto';
import { NotificationType } from '../notifications/entities/notification.entity';
import { FollowRequest } from './entities/follow-request.entity';
import { Poke } from './entities/poke.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MediaService } from '../media/media.service';
import { StorageService } from '../storage/storage.service';
import { LifeEvent } from './entities/life-event.entity';
import { WebhooksService } from '../webhooks/webhooks.service';
import { LoginSession } from '../auth/entities/login-session.entity';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';

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
  let loginSessionsRepo: jest.Mocked<Repository<LoginSession>>;
  let mediaService: jest.Mocked<MediaService>;
  let storageService: jest.Mocked<StorageService>;
  let webhooksService: jest.Mocked<WebhooksService>;
  let dataPermissions: jest.Mocked<DataPermissionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: MediaService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({ url: '/uploads/avatars/updated.jpg' }),
          },
        },
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
          provide: getRepositoryToken(LoginSession),
          useValue: {
            update: jest.fn(),
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
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: WebhooksService,
          useValue: {
            dispatchEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DataPermissionsService,
          useValue: { require: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    postsRepo = module.get(getRepositoryToken(Post)) as jest.Mocked<Repository<Post>>;
    followRequestRepo = module.get(getRepositoryToken(FollowRequest)) as jest.Mocked<
      Repository<FollowRequest>
    >;
    pokeRepo = module.get(getRepositoryToken(Poke)) as jest.Mocked<Repository<Poke>>;
    lifeEventRepo = module.get(getRepositoryToken(LifeEvent)) as jest.Mocked<Repository<LifeEvent>>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    loginSessionsRepo = module.get(getRepositoryToken(LoginSession)) as jest.Mocked<
      Repository<LoginSession>
    >;
    mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    webhooksService = module.get(WebhooksService) as jest.Mocked<WebhooksService>;
    dataPermissions = module.get(DataPermissionsService) as jest.Mocked<DataPermissionsService>;
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
      usersRepo.save.mockResolvedValue({
        ...user,
        displayName: 'Updated Name',
        bio: 'Updated bio',
      });

      const result = await service.updateProfile(
        user.id,
        { displayName: 'Updated Name', bio: 'Updated bio' } as any,
        null
      );

      expect(result.displayName).toBe('Updated Name');
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfile('bad-id', {} as any, null)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ConflictException when username is taken', async () => {
      const user = makeUser();
      const otherUser = makeUser({ id: 'other-id', username: 'taken' });
      usersRepo.findOne.mockResolvedValueOnce(user); // findById
      usersRepo.findOne.mockResolvedValueOnce(otherUser); // check username

      await expect(
        service.updateProfile(user.id, { username: 'taken' } as any, null)
      ).rejects.toThrow(ConflictException);
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

      await service.updateProfile(
        user.id,
        {
          profileTheme: 'dark-neon',
          profileThemeColor: '#ff0000',
          profileBioFont: 'Space Grotesk',
        } as any,
        null
      );

      expect(user.profileTheme).toBe('dark-neon');
      expect(user.profileThemeColor).toBe('#ff0000');
      expect(user.profileBioFont).toBe('Space Grotesk');
    });

    it('uploads avatar when provided', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      const mockFile = {
        buffer: Buffer.from('fake-image'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
      };

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

      await expect(service.update(user.id, { username: 'taken' } as any)).rejects.toThrow(
        ConflictException
      );
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
      expect(loginSessionsRepo.update).toHaveBeenCalledWith(
        { user: { id: user.id }, revokedAt: expect.anything() },
        { revokedAt: expect.any(Date) }
      );
    });

    it('stores the reason and deactivation timestamp', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation(async (value) => value as any);

      await service.deactivate(user.id, 'Taking a break');

      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'deactivated',
          deactivationReason: 'Taking a break',
          deactivatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('purgeExpiredDeactivatedAccounts', () => {
    it('removes accounts whose reactivation window has expired', async () => {
      const expiredAccount = makeUser({ status: 'deactivated' as any });
      usersRepo.find.mockResolvedValue([expiredAccount]);
      usersRepo.remove.mockResolvedValue(expiredAccount);

      await expect(service.purgeExpiredDeactivatedAccounts()).resolves.toBe(1);

      expect(usersRepo.find).toHaveBeenCalledWith({
        where: {
          status: 'deactivated',
          deactivatedAt: expect.anything(),
        },
      });
      expect(usersRepo.remove).toHaveBeenCalledWith(expiredAccount);
    });

    it('does nothing when no accounts have expired', async () => {
      usersRepo.find.mockResolvedValue([]);

      await expect(service.purgeExpiredDeactivatedAccounts()).resolves.toBe(0);

      expect(usersRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('reactivate', () => {
    it('restores a deactivated account', async () => {
      const user = makeUser({ status: 'deactivated' as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue({ ...user, status: 'active' });

      const result = await service.reactivate(user.id);

      expect(result.status).toBe('active');
      expect(usersRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('rejects accounts outside the 90-day reactivation window', async () => {
      const user = makeUser({
        status: 'deactivated' as any,
        deactivatedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
      });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.reactivate(user.id)).rejects.toThrow(
        '90-day reactivation window has expired'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('rejects active accounts', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ status: 'active' as any }));

      await expect(service.reactivate('user-id')).rejects.toThrow('Account is not deactivated');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Follow / Unfollow ────────────────────────────────────────────────

  describe('follow', () => {
    it('follows another user', async () => {
      const follower = makeUser({ following: [] });
      const target = makeUser({ id: 'target-id', username: 'target' });
      // follow() calls findOne 4 times: isBlockedBy(target, follower), isBlockedBy(follower, target), follower, target
      usersRepo.findOne.mockResolvedValueOnce(target); // isBlockedBy: target not blocking follower
      usersRepo.findOne.mockResolvedValueOnce(follower); // isBlockedBy: follower not blocking target
      usersRepo.findOne.mockResolvedValueOnce(follower); // get follower with following
      usersRepo.findOne.mockResolvedValueOnce(target); // get target

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
      usersRepo.findOne.mockResolvedValueOnce(target); // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(follower); // isBlockedBy
      usersRepo.findOne.mockResolvedValueOnce(follower); // get follower with following
      usersRepo.findOne.mockResolvedValueOnce(target); // get target

      await service.follow(follower.id, target.id);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      const follower = makeUser();
      usersRepo.findOne.mockResolvedValueOnce(null); // isBlockedBy returns null

      await expect(service.follow(follower.id, 'nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
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
        makeUser({ id: follower.id, blockedUsers: [target] })
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
      const user = makeUser({
        followers: [
          { id: 'f1', username: 'alice' },
          { id: 'f2', username: 'bob' },
        ] as any,
      });
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
      const viewerBlocked = makeUser({
        id: 'viewer-id',
        blockedUsers: [makeUser({ id: 'profile-owner' })],
      });
      usersRepo.findOne.mockResolvedValue(viewerBlocked);

      await expect(service.findOneWithPosts('profile-owner', 'viewer-id')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('throws ForbiddenException for private profile when viewer is not a follower', async () => {
      const privateUser = makeUser({
        profilePrivacy: 'private' as any,
        followers: [], // empty followers list
      });
      usersRepo.findOne.mockResolvedValue(privateUser);

      await expect(service.findOneWithPosts(privateUser.id, 'non-follower-id')).rejects.toThrow(
        ForbiddenException
      );
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
        })
      );
    });

    it('hides no-one users and allows mutual friends', async () => {
      const viewer = makeUser({ id: 'viewer-id' });
      const hidden = makeUser({ id: 'hidden-id', searchVisibility: 'no_one' });
      const friend = makeUser({
        id: 'friend-id',
        searchVisibility: 'friends',
        followers: [viewer],
        following: [viewer],
      });
      usersRepo.find.mockResolvedValue([hidden, friend]);

      await expect(service.search('test', viewer.id)).resolves.toEqual([friend]);
    });

    it('always allows a user to find their own profile', async () => {
      const viewer = makeUser({ id: 'viewer-id', searchVisibility: 'no_one' });
      usersRepo.find.mockResolvedValue([viewer]);

      await expect(service.search('test', viewer.id)).resolves.toEqual([viewer]);
    });
  });

  describe('discoverContacts', () => {
    it('normalizes emails, excludes the requester, and returns public profile fields', async () => {
      const requester = makeUser({ id: 'requester-id', email: 'me@example.com' });
      const match = makeUser({ id: 'match-id', email: 'friend@example.com', username: 'friend' });
      usersRepo.find.mockResolvedValue([requester, match]);

      const result = await service.discoverContacts('requester-id', {
        contacts: [' FRIEND@EXAMPLE.COM ', 'friend@example.com', 'me@example.com'],
      });

      expect(usersRepo.find).toHaveBeenCalledWith({
        where: [
          { email: expect.any(Object), contactDiscovery: true },
          { phoneNumber: expect.any(Object), contactDiscovery: true },
        ],
      });
      expect(result).toEqual([
        {
          id: 'match-id',
          username: 'friend',
          displayName: 'Test User',
          avatar: '/uploads/avatars/test.jpg',
        },
      ]);
      expect(result[0]).not.toHaveProperty('email');
    });

    it('filters banned and deactivated accounts', async () => {
      usersRepo.find.mockResolvedValue([
        makeUser({ id: 'banned-id', banned: true }),
        makeUser({ id: 'deactivated-id', status: 'deactivated' }),
      ]);

      await expect(
        service.discoverContacts('requester-id', { contacts: ['friend@example.com'] })
      ).resolves.toEqual([]);
    });

    it('does not query for an empty contact list', async () => {
      await expect(service.discoverContacts('requester-id', { contacts: [] })).resolves.toEqual([]);
      expect(usersRepo.find).not.toHaveBeenCalled();
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

      const result = await service.addLifeEvent(user.id, {
        title: 'New Job',
        date: '2024-01-01',
        type: 'work',
      } as any);
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
      await expect(service.createFollowRequest('requester-id', 'missing-id')).rejects.toThrow(
        NotFoundException
      );
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
      await expect(service.acceptFollowRequest('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('acceptFollowRequest throws NotFoundException for wrong recipient', async () => {
      const followReq = { id: 'req-1', recipient: { id: 'other-user' } } as any;
      followRequestRepo.findOne.mockResolvedValue(followReq);
      await expect(service.acceptFollowRequest('user-1', 'req-1')).rejects.toThrow(
        NotFoundException
      );
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
      await expect(service.denyFollowRequest('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException
      );
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
      await expect(service.findMutualFollows('bad-id', 'user-2')).rejects.toThrow(
        NotFoundException
      );
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
      const pendingRequests = [{ id: 'req-1', requester, status: 'pending' } as any];
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

      await expect(service.cancelFollowRequest('requester-id', 'req-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when request belongs to another user', async () => {
      // The findOne query uses { where: { id, requester: { id: requesterId } } },
      // so a request owned by another user returns null from the mock
      followRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelFollowRequest('requester-id', 'req-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ─── Response helpers ─────────────────────────────────────────────────

  describe('response helpers', () => {
    it('toPublicUserResponse returns null for a missing user', () => {
      expect(toPublicUserResponse(null)).toBeNull();
      expect(toPublicUserResponse(undefined)).toBeNull();
    });

    it('toPublicUserResponse exposes only public non-draft posts with their media', () => {
      const createdAt = new Date('2024-03-01T10:00:00Z');
      const draft = {
        id: 'p-draft',
        content: 'draft',
        createdAt,
        visibility: 'public',
        isDraft: true,
        media: [],
      };
      const friendsOnly = {
        id: 'p-friends',
        content: 'friends',
        createdAt,
        visibility: 'friends',
        isDraft: false,
        media: [],
      };
      const published = {
        id: 'p-pub',
        content: 'hello world',
        createdAt,
        visibility: 'public',
        isDraft: false,
        media: [{ id: 'm1', url: '/uploads/m1.png', type: 'image', altText: 'an alt' }],
      };
      const user = makeUser({
        posts: [draft, friendsOnly, published] as any,
        followers: [{ id: 'f1' }] as any,
        following: [{ id: 'g1' }] as any,
      });

      const res = toPublicUserResponse(user);

      expect(res!.posts).toHaveLength(1);
      expect(res!.posts[0]).toEqual({
        id: 'p-pub',
        content: 'hello world',
        createdAt,
        visibility: 'public',
        media: [{ id: 'm1', url: '/uploads/m1.png', type: 'image', altText: 'an alt' }],
      });
      expect(res!.followerCount).toBe(1);
      expect(res!.followingCount).toBe(1);
      expect(res).not.toHaveProperty('email');
      expect(res).not.toHaveProperty('password_hash');
    });

    it('toPublicUserResponse tolerates missing relations', () => {
      const user = makeUser();
      delete (user as any).posts;
      delete (user as any).followers;
      delete (user as any).following;

      const res = toPublicUserResponse(user);

      expect(res!.posts).toBeUndefined();
      expect(res!.followerCount).toBeUndefined();
      expect(res!.followingCount).toBeUndefined();
    });

    it('toSelfUserResponse adds private fields and maps relations to public shapes', () => {
      const user = makeUser({
        following: [makeUser({ id: 'g1', username: 'gee', email: 'gee@example.com' })] as any,
        followers: [makeUser({ id: 'f1', username: 'eff', email: 'eff@example.com' })] as any,
      });
      (user as any).role = Role.ADMIN;
      (user as any).personalization = true;
      (user as any).emailVerified = true;

      const res = toSelfUserResponse(user);

      expect(res.email).toBe('test@example.com');
      expect(res.role).toBe(Role.ADMIN);
      expect(res.personalization).toBe(true);
      expect(res.personalizationControls).toEqual(
        expect.objectContaining({ feedPersonalization: true })
      );
      expect(res.following).toHaveLength(1);
      expect(res.following[0]).toEqual(expect.objectContaining({ id: 'g1', username: 'gee' }));
      expect(res.following[0]).not.toHaveProperty('email');
      expect(res.followers).toHaveLength(1);
      expect(res.followers[0]).toEqual(expect.objectContaining({ id: 'f1', username: 'eff' }));
      expect(res.followers[0]).not.toHaveProperty('email');
      expect(res).toHaveProperty('emailVerified', true);
    });

    it('toSearchUserResponse includes the email only when asked and present', () => {
      const withEmail = makeUser({ email: 'findme@example.com' });
      expect(toSearchUserResponse(withEmail, true).email).toBe('findme@example.com');
      expect(toSearchUserResponse(withEmail, false)).not.toHaveProperty('email');

      const withoutEmail = makeUser({ email: undefined as any });
      expect(toSearchUserResponse(withoutEmail, true)).not.toHaveProperty('email');
    });
  });

  // ─── updateFaceRecognition ────────────────────────────────────────────

  describe('updateFaceRecognition', () => {
    it('enables face recognition for an existing user', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updateFaceRecognition(user.id, {
        isFaceRecognitionEnabled: true,
      });

      expect(result.isFaceRecognitionEnabled).toBe(true);
      expect(result.isRegionEligibleForFaceRecognition).toBe(true);
      expect(usersRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }));
    });

    it('disables face recognition', async () => {
      const user = makeUser({ isFaceRecognitionEnabled: true });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updateFaceRecognition(user.id, {
        isFaceRecognitionEnabled: false,
      });

      expect(result.isFaceRecognitionEnabled).toBe(false);
      expect(result.isRegionEligibleForFaceRecognition).toBe(true);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateFaceRecognition('bad-id', { isFaceRecognitionEnabled: true })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateAvatar ─────────────────────────────────────────────────────

  describe('updateAvatar', () => {
    it('requires the profile permission, uploads the file and stores its url', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));
      const file: any = {
        buffer: Buffer.from('png'),
        originalname: 'a.png',
        mimetype: 'image/png',
      };

      const result = await service.updateAvatar(user.id, file);

      expect(dataPermissions.require).toHaveBeenCalledWith(user.id, DataPermission.PROFILE);
      expect(mediaService.uploadFile).toHaveBeenCalledWith(file, {
        userId: user.id,
        subdir: 'avatars',
      });
      expect(result.avatar).toBe('/uploads/avatars/updated.jpg');
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ avatar: '/uploads/avatars/updated.jpg' })
      );
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateAvatar('bad-id', { mimetype: 'image/png' } as any)
      ).rejects.toThrow(NotFoundException);
      expect(mediaService.uploadFile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no file is supplied', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.updateAvatar('user-id', undefined as any)).rejects.toThrow(
        'No file uploaded'
      );
      expect(mediaService.uploadFile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for non-image files', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      await expect(
        service.updateAvatar('user-id', { mimetype: 'video/mp4' } as any)
      ).rejects.toThrow('Avatar must be an image');
      expect(mediaService.uploadFile).not.toHaveBeenCalled();
    });
  });

  // ─── Privacy reads / personalization reset ────────────────────────────

  describe('getPrivacy', () => {
    it('returns the full privacy snapshot with normalized controls', async () => {
      const user = makeUser({
        postVisibility: 'friends' as any,
        emailSearchPrivacy: 'no_one' as any,
        showOnlineStatus: false,
        mentions: 'followers' as any,
        searchVisibility: 'friends' as any,
        personalizationControls: { feedPersonalization: false } as any,
      });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getPrivacy(user.id);

      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: user.id }, relations: [] });
      expect(result.postVisibility).toBe('friends');
      expect(result.emailSearchPrivacy).toBe('no_one');
      expect(result.showOnlineStatus).toBe(false);
      expect(result.mentions).toBe('followers');
      expect(result.searchVisibility).toBe('friends');
      expect(result.personalizationControls).toEqual(
        expect.objectContaining({ feedPersonalization: false })
      );
      expect(result.personalizationControls).toEqual(
        expect.objectContaining({ recommendations: true })
      );
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getPrivacy('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPersonalizationControls', () => {
    it('restores the default controls and persists them', async () => {
      const user = makeUser({
        personalizationControls: { feedPersonalization: false, recommendations: false } as any,
      });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.resetPersonalizationControls(user.id);

      expect(result.personalizationControls.feedPersonalization).toBe(true);
      expect(result.personalizationControls.recommendations).toBe(true);
      expect(user.personalizationControls).toEqual(result.personalizationControls);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPersonalizationControls('bad-id')).rejects.toThrow(
        NotFoundException
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Lookup & token helpers ───────────────────────────────────────────

  describe('lookup and token helpers', () => {
    it('findByWalletAddress queries by wallet address', async () => {
      const user = makeUser({ walletAddress: '0xdeadbeef' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findByWalletAddress('0xdeadbeef')).resolves.toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { walletAddress: '0xdeadbeef' } });
    });

    it('findByEmailVerificationToken queries by token', async () => {
      const user = makeUser({ emailVerificationToken: 'verify-me' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findByEmailVerificationToken('verify-me')).resolves.toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: 'verify-me' },
      });
    });

    it('findByMagicLinkTokenHash queries by hash', async () => {
      const user = makeUser({ magicLinkTokenHash: 'hash-1' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findByMagicLinkTokenHash('hash-1')).resolves.toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { magicLinkTokenHash: 'hash-1' } });
    });

    it('setPasswordResetToken stores the token and its expiry', async () => {
      const expires = new Date('2030-01-01T00:00:00Z');
      usersRepo.update.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.setPasswordResetToken('user-1', 'reset-token', expires);

      expect(usersRepo.update).toHaveBeenCalledWith('user-1', {
        passwordResetToken: 'reset-token',
        passwordResetTokenExpires: expires,
      });
    });

    it('findByPasswordResetToken queries by token', async () => {
      const user = makeUser({ passwordResetToken: 'reset-token' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findByPasswordResetToken('reset-token')).resolves.toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { passwordResetToken: 'reset-token' },
      });
    });

    it('findUserByIdOrUsername returns undefined for an empty identifier without querying', async () => {
      await expect(service.findUserByIdOrUsername('')).resolves.toBeUndefined();
      await expect(service.findUserByIdOrUsername(undefined as any)).resolves.toBeUndefined();
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('findUserByIdOrUsername queries both id and username', async () => {
      const user = makeUser({ username: 'lookup-me' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findUserByIdOrUsername('lookup-me', ['followers'])).resolves.toBe(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: [{ id: 'lookup-me' }, { username: 'lookup-me' }],
        relations: ['followers'],
      });
    });
  });

  // ─── findOrCreate / guest / anonymous / save ──────────────────────────

  describe('findOrCreate', () => {
    it('returns the existing user matched on provider and provider id', async () => {
      const existing = makeUser({ provider: 'google', providerId: 'g-1' } as any);
      usersRepo.findOne.mockResolvedValue(existing);

      const result = await service.findOrCreate('google', 'g-1', 'a@example.com');

      expect(result).toBe(existing);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { provider: 'google', providerId: 'g-1' },
      });
      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('links an existing email account to the new provider', async () => {
      const byEmail = makeUser({ email: 'a@example.com', provider: null } as any);
      usersRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(byEmail);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.findOrCreate('google', 'g-1', 'a@example.com');

      expect(result.provider).toBe('google');
      expect(result.providerId).toBe('g-1');
      expect(usersRepo.save).toHaveBeenCalledWith(byEmail);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('creates a brand new user when neither provider nor email matches', async () => {
      const created = makeUser({ email: 'b@example.com' } as any);
      usersRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      const result = await service.findOrCreate('github', 'gh-9', 'b@example.com');

      expect(usersRepo.create).toHaveBeenCalledWith({
        email: 'b@example.com',
        provider: 'github',
        providerId: 'gh-9',
      });
      expect(usersRepo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe('createGuestUser / createAnonymousUser / save', () => {
    it('creates a guest user with a generated guest username', async () => {
      usersRepo.create.mockImplementation((data: any) => ({ ...data, id: 'new-id' }) as any);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.createGuestUser();

      expect(usersRepo.create).toHaveBeenCalledWith({
        username: expect.stringMatching(/^guest_[0-9a-f]{8}$/),
        isGuest: true,
        emailVerified: true,
      });
      expect(result.username).toMatch(/^guest_[0-9a-f]{8}$/);
      expect(result.isGuest).toBe(true);
      expect(usersRepo.save).toHaveBeenCalledWith(result);
    });

    it('creates an anonymous user with a generated anonymous username', async () => {
      usersRepo.create.mockImplementation((data: any) => ({ ...data, id: 'new-id' }) as any);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.createAnonymousUser();

      expect(usersRepo.create).toHaveBeenCalledWith({
        username: expect.stringMatching(/^anonymous_[0-9a-f]{8}$/),
        isGuest: true,
        emailVerified: true,
      });
      expect(result.username).toMatch(/^anonymous_[0-9a-f]{8}$/);
      expect(usersRepo.save).toHaveBeenCalledWith(result);
    });

    it('save delegates to the repository', async () => {
      const user = makeUser();
      usersRepo.save.mockResolvedValue(user);

      await expect(service.save(user)).resolves.toBe(user);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });
  });

  // ─── Birth date / age verification ────────────────────────────────────

  describe('setBirthDate', () => {
    it('stores an adult birth date and stamps verification when unverified', async () => {
      const user = makeUser({ birthDate: null, birthDateVerifiedAt: null });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.setBirthDate(user.id, '1990-05-04');

      expect(result.birthDate).toBe('1990-05-04');
      expect(result.birthDateVerifiedAt).toBeInstanceOf(Date);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('keeps an existing verification stamp', async () => {
      const stamp = new Date('2024-01-01T00:00:00Z');
      const user = makeUser({ birthDate: null, birthDateVerifiedAt: stamp });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.setBirthDate(user.id, '1990-05-04');

      expect(result.birthDateVerifiedAt).toBe(stamp);
    });

    it('clears verification when the birth date is under 18', async () => {
      const user = makeUser({ birthDateVerifiedAt: new Date() });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));
      const tenYearsAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const result = await service.setBirthDate(user.id, tenYearsAgo);

      expect(result.birthDateVerifiedAt).toBeNull();
    });

    it('rejects an unparseable birth date', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.setBirthDate('user-id', 'not-a-date')).rejects.toThrow(
        'Invalid birth date'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a future birth date', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.setBirthDate('user-id', '2999-01-01')).rejects.toThrow(
        'Birth date cannot be in the future'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.setBirthDate('bad-id', '1990-01-01')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAgeVerificationStatus', () => {
    it('reports an unverified adult with no birth date', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ birthDate: null, birthDateVerifiedAt: null }));

      const result = await service.getAgeVerificationStatus('user-id');

      expect(result).toEqual({ birthDateSet: false, verified: false, isAdult: false, age: null });
    });

    it('reports a verified adult', async () => {
      usersRepo.findOne.mockResolvedValue(
        makeUser({ birthDate: '1990-05-04', birthDateVerifiedAt: new Date() })
      );

      const result = await service.getAgeVerificationStatus('user-id');

      expect(result.birthDateSet).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.isAdult).toBe(true);
      expect(result.age).toBeGreaterThanOrEqual(35);
    });

    it('reports a minor', async () => {
      const recent = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      usersRepo.findOne.mockResolvedValue(
        makeUser({ birthDate: recent, birthDateVerifiedAt: null })
      );

      const result = await service.getAgeVerificationStatus('user-id');

      expect(result).toEqual({
        birthDateSet: true,
        verified: false,
        isAdult: false,
        age: expect.any(Number),
      });
      expect(result.age).toBeLessThan(18);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getAgeVerificationStatus('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isAgeVerified', () => {
    it('returns false when the user does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.isAgeVerified('bad-id')).resolves.toBe(false);
    });

    it('returns false when the birth date was never verified', async () => {
      usersRepo.findOne.mockResolvedValue(
        makeUser({ birthDate: '1990-05-04', birthDateVerifiedAt: null })
      );
      await expect(service.isAgeVerified('user-id')).resolves.toBe(false);
    });

    it('returns true for a verified adult', async () => {
      usersRepo.findOne.mockResolvedValue(
        makeUser({ birthDate: '1990-05-04', birthDateVerifiedAt: new Date() })
      );
      await expect(service.isAgeVerified('user-id')).resolves.toBe(true);
    });

    it('returns false when verification exists but the user is still a minor', async () => {
      const recent = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      usersRepo.findOne.mockResolvedValue(
        makeUser({ birthDate: recent, birthDateVerifiedAt: new Date() })
      );
      await expect(service.isAgeVerified('user-id')).resolves.toBe(false);
    });
  });

  // ─── Favorites ────────────────────────────────────────────────────────

  describe('favorites', () => {
    it('adds a favorite', async () => {
      const user = makeUser({ favorites: [] });
      const target = makeUser({ id: 'target-id', username: 'fav' });
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.addFavorite(user.id, target.id);

      expect(user.favorites).toEqual([target]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('does not add the same favorite twice', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ favorites: [target] });
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(target);

      await service.addFavorite(user.id, target.id);

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(user.favorites).toHaveLength(1);
    });

    it('throws NotFoundException when the favouriting user is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.addFavorite('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the favourite target is missing', async () => {
      const user = makeUser({ favorites: [] });
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
      await expect(service.addFavorite(user.id, 'missing-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('removes a favorite', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ favorites: [target] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.removeFavorite(user.id, target.id);

      expect(user.favorites).toEqual([]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('is a no-op when the user is not a favorite', async () => {
      const user = makeUser({ favorites: [] });
      usersRepo.findOne.mockResolvedValue(user);

      await service.removeFavorite(user.id, 'someone');

      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the user is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.removeFavorite('bad-id', 'target-id')).rejects.toThrow(
        NotFoundException
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Bulk lookups ─────────────────────────────────────────────────────

  describe('bulk lookups', () => {
    it('findAll returns every user', async () => {
      const users = [makeUser(), makeUser({ id: 'u2' })];
      usersRepo.find.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toBe(users);
      expect(usersRepo.find).toHaveBeenCalledWith();
    });

    it('findByUsernames queries usernames with an IN operator', async () => {
      const users = [makeUser({ username: 'alice' })];
      usersRepo.find.mockResolvedValue(users);

      const result = await service.findByUsernames(['alice', 'bob']);

      expect(result).toBe(users);
      const arg: any = usersRepo.find.mock.calls[0][0];
      expect(arg.where.username.value).toEqual(['alice', 'bob']);
      expect(arg.where.username.type).toBe('in');
    });

    it('findMultipleByIds queries ids with an IN operator', async () => {
      const users = [makeUser()];
      usersRepo.find.mockResolvedValue(users);

      const result = await service.findMultipleByIds(['id-1', 'id-2']);

      expect(result).toBe(users);
      const arg: any = usersRepo.find.mock.calls[0][0];
      expect(arg.where.id.value).toEqual(['id-1', 'id-2']);
      expect(arg.where.id.type).toBe('in');
    });
  });

  // ─── search: email (@) expansion ──────────────────────────────────────

  describe('search with an email query', () => {
    it('applies email search privacy when nobody is searching', async () => {
      const open = makeUser({ id: 'open-id', emailSearchPrivacy: 'everyone' as any });
      const friendsOnly = makeUser({
        id: 'friends-id',
        emailSearchPrivacy: 'friends' as any,
        searchVisibility: 'everyone' as any,
      });
      const noOne = makeUser({ id: 'closed-id', emailSearchPrivacy: 'no_one' as any });
      const nameHidden = makeUser({
        id: 'hidden-id',
        emailSearchPrivacy: 'everyone' as any,
        searchVisibility: 'no_one' as any,
      });
      usersRepo.find
        .mockResolvedValueOnce([]) // username / display name matches
        .mockResolvedValueOnce([open, friendsOnly, noOne, nameHidden]); // email matches

      const result = await service.search('findme@example.com');

      expect(usersRepo.find).toHaveBeenNthCalledWith(2, {
        where: { email: expect.any(Object) },
        relations: ['followers'],
      });
      expect(result.map((u) => u.id)).toEqual(['open-id']);
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('applies email and name visibility when a viewer searches', async () => {
      const viewer = makeUser({ id: 'viewer-id' });
      const emailFriend = makeUser({
        id: 'e1',
        emailSearchPrivacy: 'friends' as any,
        searchVisibility: 'everyone' as any,
        followers: [viewer] as any,
      });
      const emailStranger = makeUser({
        id: 'e2',
        emailSearchPrivacy: 'friends' as any,
        searchVisibility: 'everyone' as any,
        followers: [],
      });
      const mutual = makeUser({
        id: 'e3',
        emailSearchPrivacy: 'everyone' as any,
        searchVisibility: 'friends' as any,
        followers: [viewer] as any,
        following: [viewer] as any,
      });
      const halfMutual = makeUser({
        id: 'e4',
        emailSearchPrivacy: 'everyone' as any,
        searchVisibility: 'friends' as any,
        followers: [viewer] as any,
        following: [],
      });
      const nameHidden = makeUser({
        id: 'e5',
        emailSearchPrivacy: 'everyone' as any,
        searchVisibility: 'no_one' as any,
      });
      const selfMatch = makeUser({
        id: 'viewer-id',
        emailSearchPrivacy: 'everyone' as any,
        searchVisibility: 'no_one' as any,
      });
      usersRepo.find
        .mockResolvedValueOnce([]) // username / display name matches
        .mockResolvedValueOnce([
          emailFriend,
          emailStranger,
          mutual,
          halfMutual,
          nameHidden,
          selfMatch,
        ]);
      usersRepo.findOne.mockResolvedValue(viewer); // the searching user (with 'following')

      const result = await service.search('someone@example.com', viewer.id);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: viewer.id },
        relations: ['following'],
      });
      expect(result.map((u) => u.id).sort()).toEqual(['e1', 'e3', 'viewer-id']);
    });
  });

  // ─── findOrCreatePlatformUser ─────────────────────────────────────────

  describe('findOrCreatePlatformUser', () => {
    it('returns the existing platform account', async () => {
      const platform = makeUser({ email: 'platform@zynkra.com', role: Role.ADMIN });
      usersRepo.findOne.mockResolvedValue(platform);

      await expect(service.findOrCreatePlatformUser()).resolves.toBe(platform);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('creates the platform admin account when it is missing', async () => {
      const created = makeUser({ email: 'platform@zynkra.com', role: Role.ADMIN });
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      await expect(service.findOrCreatePlatformUser()).resolves.toBe(created);
      expect(usersRepo.create).toHaveBeenCalledWith({
        email: 'platform@zynkra.com',
        role: Role.ADMIN,
      });
      expect(usersRepo.save).toHaveBeenCalledWith(created);
    });
  });

  // ─── ban / restrict ───────────────────────────────────────────────────

  describe('ban', () => {
    it('flags the user as banned and persists it', async () => {
      const user = makeUser({ banned: false });
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.ban(user);

      expect(result.banned).toBe(true);
      expect(usersRepo.save).toHaveBeenCalledWith(expect.objectContaining({ banned: true }));
    });
  });

  describe('restrict / unrestrict / getRestrictedUsers', () => {
    it('restricts another user', async () => {
      const user = makeUser({ restrictedUsers: [] });
      const target = makeUser({ id: 'target-id', username: 'target' });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.restrict(user.id, target.id);

      expect(user.restrictedUsers).toEqual([target]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('restrict throws when the requesting user is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null);
      usersRepo.findOneBy.mockResolvedValueOnce(makeUser({ id: 'target-id' }));
      await expect(service.restrict('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('restrict throws when the target user is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser());
      usersRepo.findOneBy.mockResolvedValueOnce(null);
      await expect(service.restrict('user-id', 'missing-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('restrict throws when trying to restrict yourself', async () => {
      const user = makeUser({ restrictedUsers: [] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(user);
      await expect(service.restrict(user.id, user.id)).rejects.toThrow(
        'You cannot restrict yourself.'
      );
    });

    it('restrict throws when the user is already restricted', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ restrictedUsers: [target] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);
      await expect(service.restrict(user.id, target.id)).rejects.toThrow(
        'User is already restricted.'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unrestricts a restricted user', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ restrictedUsers: [target] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unrestrict(user.id, target.id);

      expect(user.restrictedUsers).toEqual([]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unrestrict throws when the user is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unrestrict('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
    });

    it('unrestrict throws when the user is not restricted', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ restrictedUsers: [] }));
      await expect(service.unrestrict('user-id', 'someone')).rejects.toThrow(
        'User is not restricted.'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('getRestrictedUsers returns the restricted list', async () => {
      const target = makeUser({ id: 'target-id' });
      usersRepo.findOne.mockResolvedValue(makeUser({ restrictedUsers: [target] }));

      await expect(service.getRestrictedUsers('user-id')).resolves.toEqual([target]);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        relations: ['restrictedUsers'],
      });
    });

    it('getRestrictedUsers throws when the user is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getRestrictedUsers('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── mute / unmute ────────────────────────────────────────────────────

  describe('mute / unmute / getMutedUsers', () => {
    it('mutes another user', async () => {
      const user = makeUser({ mutedUsers: [] });
      const target = makeUser({ id: 'target-id', username: 'target' });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.mute(user.id, target.id);

      expect(user.mutedUsers).toEqual([target]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('mute throws when trying to mute yourself', async () => {
      const user = makeUser({ mutedUsers: [] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(user);
      await expect(service.mute(user.id, user.id)).rejects.toThrow('You cannot mute yourself.');
    });

    it('mute throws when the user is already muted', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ mutedUsers: [target] });
      usersRepo.findOne.mockResolvedValueOnce(user);
      usersRepo.findOneBy.mockResolvedValueOnce(target);
      await expect(service.mute(user.id, target.id)).rejects.toThrow('User is already muted.');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unmutes a muted user', async () => {
      const target = makeUser({ id: 'target-id' });
      const user = makeUser({ mutedUsers: [target] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unmute(user.id, target.id);

      expect(user.mutedUsers).toEqual([]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unmute throws when the user is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unmute('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
    });

    it('unmute throws when the user is not muted', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ mutedUsers: [] }));
      await expect(service.unmute('user-id', 'someone')).rejects.toThrow('User is not muted.');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('getMutedUsers returns the muted list', async () => {
      const target = makeUser({ id: 'target-id' });
      usersRepo.findOne.mockResolvedValue(makeUser({ mutedUsers: [target] }));

      await expect(service.getMutedUsers('user-id')).resolves.toEqual([target]);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        relations: ['mutedUsers'],
      });
    });

    it('getMutedUsers throws when the user is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getMutedUsers('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Hashtag following ────────────────────────────────────────────────

  describe('followHashtag / unfollowHashtag', () => {
    it('follows a new hashtag and stores it lowercased', async () => {
      const user = makeUser({ followedHashtags: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.followHashtag(user.id, 'Tech');

      expect(user.followedHashtags).toHaveLength(1);
      expect(user.followedHashtags[0]).toEqual({ id: expect.any(String), name: 'tech' });
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('does not follow an already-followed hashtag twice', async () => {
      const user = makeUser({ followedHashtags: [{ id: 'h1', name: 'tech' }] as any });
      usersRepo.findOne.mockResolvedValue(user);

      await service.followHashtag(user.id, 'tech');

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(user.followedHashtags).toHaveLength(1);
    });

    it('currently stores a duplicate when the input case differs from the stored name', async () => {
      // Production defect: the membership check at users.service.ts:1175 compares the raw
      // input, but the stored name is lowercased — so 'Tech' bypasses the guard.
      const user = makeUser({ followedHashtags: [{ id: 'h1', name: 'tech' }] as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.followHashtag(user.id, 'Tech');

      expect(user.followedHashtags).toEqual([
        { id: 'h1', name: 'tech' },
        { id: expect.any(String), name: 'tech' },
      ]);
    });

    it('followHashtag throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.followHashtag('bad-id', 'tech')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unfollows a hashtag regardless of input case', async () => {
      const user = makeUser({ followedHashtags: [{ id: 'h1', name: 'tech' }] as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unfollowHashtag(user.id, 'TECH');

      expect(user.followedHashtags).toEqual([]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unfollowHashtag throws when the hashtag is not followed', async () => {
      const user = makeUser({ followedHashtags: [] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unfollowHashtag(user.id, 'tech')).rejects.toThrow(
        'Hashtag is not being followed'
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unfollowHashtag treats a user with no hashtags as following none', async () => {
      const user = makeUser({ followedHashtags: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unfollowHashtag(user.id, 'tech')).rejects.toThrow(
        'Hashtag is not being followed'
      );
    });

    it('unfollowHashtag throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unfollowHashtag('bad-id', 'tech')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Blocked keywords ─────────────────────────────────────────────────

  describe('blockKeyword / unblockKeyword / getBlockedKeywords', () => {
    it('blocks a keyword lowercased', async () => {
      const user = makeUser({ blockedKeywords: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.blockKeyword(user.id, 'Spoilers');

      expect(user.blockedKeywords).toEqual(['spoilers']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('does not block the same keyword twice', async () => {
      const user = makeUser({ blockedKeywords: ['spoilers'] as any });
      usersRepo.findOne.mockResolvedValue(user);

      await service.blockKeyword(user.id, 'SPOILERS');

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(user.blockedKeywords).toEqual(['spoilers']);
    });

    it('blockKeyword throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.blockKeyword('bad-id', 'spoilers')).rejects.toThrow(NotFoundException);
    });

    it('unblocks a keyword', async () => {
      const user = makeUser({ blockedKeywords: ['spoilers', 'politics'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unblockKeyword(user.id, 'SPOILERS');

      expect(user.blockedKeywords).toEqual(['politics']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unblockKeyword throws when the keyword is not blocked', async () => {
      const user = makeUser({ blockedKeywords: [] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockKeyword(user.id, 'spoilers')).rejects.toThrow(
        'Keyword is not blocked'
      );
    });

    it('unblockKeyword treats a user with no list as having nothing blocked', async () => {
      const user = makeUser({ blockedKeywords: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockKeyword(user.id, 'spoilers')).rejects.toThrow(
        'Keyword is not blocked'
      );
    });

    it('unblockKeyword throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unblockKeyword('bad-id', 'spoilers')).rejects.toThrow(NotFoundException);
    });

    it('getBlockedKeywords returns the stored list', async () => {
      const user = makeUser({ blockedKeywords: ['spoilers'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedKeywords('user-id')).resolves.toEqual(['spoilers']);
    });

    it('getBlockedKeywords falls back to an empty list', async () => {
      const user = makeUser({ blockedKeywords: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedKeywords('user-id')).resolves.toEqual([]);
    });

    it('getBlockedKeywords throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getBlockedKeywords('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Blocked hashtags ─────────────────────────────────────────────────

  describe('blockHashtag / unblockHashtag / getBlockedHashtags', () => {
    it('blocks a hashtag lowercased', async () => {
      const user = makeUser({ blockedHashtags: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.blockHashtag(user.id, 'Sports');

      expect(user.blockedHashtags).toEqual(['sports']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('does not block the same hashtag twice', async () => {
      const user = makeUser({ blockedHashtags: ['sports'] as any });
      usersRepo.findOne.mockResolvedValue(user);

      await service.blockHashtag(user.id, 'SPORTS');

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(user.blockedHashtags).toEqual(['sports']);
    });

    it('blockHashtag throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.blockHashtag('bad-id', 'sports')).rejects.toThrow(NotFoundException);
    });

    it('unblocks a hashtag', async () => {
      const user = makeUser({ blockedHashtags: ['sports', 'politics'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unblockHashtag(user.id, 'SPORTS');

      expect(user.blockedHashtags).toEqual(['politics']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unblockHashtag throws when the hashtag is not blocked', async () => {
      const user = makeUser({ blockedHashtags: [] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockHashtag(user.id, 'sports')).rejects.toThrow(
        'Hashtag is not blocked'
      );
    });

    it('unblockHashtag treats a user with no list as having nothing blocked', async () => {
      const user = makeUser({ blockedHashtags: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockHashtag(user.id, 'sports')).rejects.toThrow(
        'Hashtag is not blocked'
      );
    });

    it('unblockHashtag throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unblockHashtag('bad-id', 'sports')).rejects.toThrow(NotFoundException);
    });

    it('getBlockedHashtags returns the stored list', async () => {
      const user = makeUser({ blockedHashtags: ['sports'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedHashtags('user-id')).resolves.toEqual(['sports']);
    });

    it('getBlockedHashtags falls back to an empty list', async () => {
      const user = makeUser({ blockedHashtags: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedHashtags('user-id')).resolves.toEqual([]);
    });

    it('getBlockedHashtags throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getBlockedHashtags('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Blocked content types ────────────────────────────────────────────

  describe('blockContentType / unblockContentType / getBlockedContentTypes', () => {
    it('blocks a content type lowercased', async () => {
      const user = makeUser({ blockedContentTypes: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.blockContentType(user.id, 'Video');

      expect(user.blockedContentTypes).toEqual(['video']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('does not block the same content type twice', async () => {
      const user = makeUser({ blockedContentTypes: ['video'] as any });
      usersRepo.findOne.mockResolvedValue(user);

      await service.blockContentType(user.id, 'VIDEO');

      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(user.blockedContentTypes).toEqual(['video']);
    });

    it('blockContentType throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.blockContentType('bad-id', 'video')).rejects.toThrow(NotFoundException);
    });

    it('unblocks a content type', async () => {
      const user = makeUser({ blockedContentTypes: ['video', 'image'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      await service.unblockContentType(user.id, 'VIDEO');

      expect(user.blockedContentTypes).toEqual(['image']);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unblockContentType throws when the content type is not blocked', async () => {
      const user = makeUser({ blockedContentTypes: [] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockContentType('user-id', 'video')).rejects.toThrow(
        'Content type is not blocked'
      );
    });

    it('unblockContentType treats a user with no list as having nothing blocked', async () => {
      const user = makeUser({ blockedContentTypes: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.unblockContentType('user-id', 'video')).rejects.toThrow(
        'Content type is not blocked'
      );
    });

    it('unblockContentType throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unblockContentType('bad-id', 'video')).rejects.toThrow(
        NotFoundException
      );
    });

    it('getBlockedContentTypes returns the stored list', async () => {
      const user = makeUser({ blockedContentTypes: ['video'] as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedContentTypes('user-id')).resolves.toEqual(['video']);
    });

    it('getBlockedContentTypes falls back to an empty list', async () => {
      const user = makeUser({ blockedContentTypes: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);
      await expect(service.getBlockedContentTypes('user-id')).resolves.toEqual([]);
    });

    it('getBlockedContentTypes throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getBlockedContentTypes('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBlockedUsers', () => {
    it('returns the blocked users with their relation loaded', async () => {
      const blocked = makeUser({ id: 'blocked-id' });
      usersRepo.findOne.mockResolvedValue(makeUser({ blockedUsers: [blocked] }));

      await expect(service.getBlockedUsers('user-id')).resolves.toEqual([blocked]);
      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        relations: ['blockedUsers'],
      });
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getBlockedUsers('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getUserFollowers ─────────────────────────────────────────────────

  describe('getUserFollowers', () => {
    it('returns followers minus blocked accounts and strips password hashes', async () => {
      const blockedFan = makeUser({ id: 'blocked-fan' });
      const fan1 = makeUser({ id: 'fan-1' });
      const fan2 = makeUser({ id: 'fan-2' });
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PUBLIC,
        followers: [fan1, fan2, blockedFan] as any,
        blockedUsers: [blockedFan] as any,
      });
      usersRepo.findOne.mockResolvedValue(profile);

      const result = await service.getUserFollowers('owner');

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: [{ id: 'owner' }, { username: 'owner' }],
        relations: ['followers', 'blockedUsers'],
      });
      expect(result.map((u) => u.id)).toEqual(['fan-1', 'fan-2']);
      expect((result[0] as any).password_hash).toBeUndefined();
      expect((result[1] as any).password_hash).toBeUndefined();
    });

    it('throws when the profile blocked the requester', async () => {
      const profile = makeUser({ username: 'owner', blockedUsers: [{ id: 'viewer-id' }] as any });
      usersRepo.findOne
        .mockResolvedValueOnce(profile) // profile lookup
        .mockResolvedValueOnce(profile); // isBlockedBy → profile blocks viewer

      await expect(service.getUserFollowers('owner', 'viewer-id')).rejects.toThrow(
        'This user has blocked you.'
      );
    });

    it('returns an empty list when the requester blocked the profile', async () => {
      const profile = makeUser({ username: 'owner', followers: [], blockedUsers: [] });
      const viewer = makeUser({ id: 'viewer-id', blockedUsers: [{ id: profile.id }] as any });
      usersRepo.findOne
        .mockResolvedValueOnce(profile) // profile lookup
        .mockResolvedValueOnce(makeUser({ blockedUsers: [] })) // isBlockedBy #1 → false
        .mockResolvedValueOnce(viewer); // isBlockedBy #2 → true

      await expect(service.getUserFollowers(profile.id, 'viewer-id')).resolves.toEqual([]);
    });

    it('lets the owner of a private profile list their followers', async () => {
      const profile = makeUser({
        id: 'owner-id',
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        followers: [],
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowers('owner-id', 'owner-id')).resolves.toEqual([]);
    });

    it('lets a follower list a private profile followers', async () => {
      const viewer = makeUser({ id: 'viewer-id' });
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        followers: [viewer] as any,
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowers('owner', 'viewer-id')).resolves.toEqual([viewer]);
    });

    it('hides a private profile from non-followers', async () => {
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        followers: [],
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowers('owner', 'stranger-id')).rejects.toThrow(
        'This profile is private.'
      );
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserFollowers('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getUserFollowing ─────────────────────────────────────────────────

  describe('getUserFollowing', () => {
    it('returns following minus blocked accounts and strips password hashes', async () => {
      const blockedTarget = makeUser({ id: 'blocked-target' });
      const t1 = makeUser({ id: 't-1' });
      const t2 = makeUser({ id: 't-2' });
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PUBLIC,
        following: [t1, t2, blockedTarget] as any,
        followers: [],
        blockedUsers: [blockedTarget] as any,
      });
      usersRepo.findOne.mockResolvedValue(profile);

      const result = await service.getUserFollowing('owner');

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: [{ id: 'owner' }, { username: 'owner' }],
        relations: ['following', 'followers', 'blockedUsers'],
      });
      expect(result.map((u) => u.id)).toEqual(['t-1', 't-2']);
      expect((result[0] as any).password_hash).toBeUndefined();
    });

    it('throws when the profile blocked the requester', async () => {
      const profile = makeUser({ username: 'owner', blockedUsers: [{ id: 'viewer-id' }] as any });
      usersRepo.findOne.mockResolvedValueOnce(profile).mockResolvedValueOnce(profile);

      await expect(service.getUserFollowing('owner', 'viewer-id')).rejects.toThrow(
        'This user has blocked you.'
      );
    });

    it('returns an empty list when the requester blocked the profile', async () => {
      const profile = makeUser({
        username: 'owner',
        following: [],
        followers: [],
        blockedUsers: [],
      });
      const viewer = makeUser({ id: 'viewer-id', blockedUsers: [{ id: profile.id }] as any });
      usersRepo.findOne
        .mockResolvedValueOnce(profile)
        .mockResolvedValueOnce(makeUser({ blockedUsers: [] }))
        .mockResolvedValueOnce(viewer);

      await expect(service.getUserFollowing(profile.id, 'viewer-id')).resolves.toEqual([]);
    });

    it('lets the owner of a private profile list who they follow', async () => {
      const profile = makeUser({
        id: 'owner-id',
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        following: [],
        followers: [],
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowing('owner-id', 'owner-id')).resolves.toEqual([]);
    });

    it('lets a follower read a private profile following list', async () => {
      const viewer = makeUser({ id: 'viewer-id' });
      const target = makeUser({ id: 'target-id' });
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        following: [target] as any,
        followers: [viewer] as any,
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowing('owner', 'viewer-id')).resolves.toEqual([target]);
    });

    it('hides a private profile following list from non-followers', async () => {
      const profile = makeUser({
        username: 'owner',
        profilePrivacy: ProfilePrivacy.PRIVATE,
        following: [],
        followers: [],
        blockedUsers: [],
      });
      usersRepo.findOne.mockResolvedValue(profile);

      await expect(service.getUserFollowing('owner', 'stranger-id')).rejects.toThrow(
        'This profile is private.'
      );
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserFollowing('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── cancelFollowRequestByUser ────────────────────────────────────────

  describe('cancelFollowRequestByUser', () => {
    it('deletes the pending request between the two users', async () => {
      const request = { id: 'req-7' } as any;
      followRequestRepo.findOne.mockResolvedValue(request);
      followRequestRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.cancelFollowRequestByUser('requester-id', 'target-id');

      expect(followRequestRepo.findOne).toHaveBeenCalledWith({
        where: {
          requester: { id: 'requester-id' },
          recipient: { id: 'target-id' },
          status: expect.anything(),
        },
      });
      expect(followRequestRepo.delete).toHaveBeenCalledWith('req-7');
    });

    it('throws NotFoundException when no pending request exists', async () => {
      followRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelFollowRequestByUser('requester-id', 'target-id')).rejects.toThrow(
        NotFoundException
      );
      expect(followRequestRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ─── findFollowSuggestions: friends-of-friends ────────────────────────

  describe('findFollowSuggestions with friends-of-friends rows', () => {
    it('orders raw candidate ids and falls back for the remainder', async () => {
      const user = makeUser({ following: [{ id: 'friend-1' }] as any });
      usersRepo.findOne.mockResolvedValue(user);
      const qb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: 'cand-1' }, { id: 'vanished' }]),
      } as any;
      usersRepo.createQueryBuilder.mockReturnValue(qb);
      usersRepo.find
        .mockResolvedValueOnce([makeUser({ id: 'cand-1' })]) // ordered fetch
        .mockResolvedValueOnce([makeUser({ id: 'recent-1' })]); // recency fill

      const suggestions = await service.findFollowSuggestions(user.id);

      expect(qb.getRawMany).toHaveBeenCalled();
      expect(suggestions.map((s) => s.id)).toEqual(['cand-1', 'recent-1']);
      expect(usersRepo.find).toHaveBeenNthCalledWith(1, { where: { id: expect.anything() } });
      const fillArg: any = usersRepo.find.mock.calls[1][0];
      expect(fillArg.where.id.value).toEqual(['friend-1', user.id, 'cand-1']);
      expect(fillArg.take).toBe(9);
      for (const s of suggestions) {
        expect((s as any).password_hash).toBeUndefined();
      }
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.findFollowSuggestions('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateNotificationSettings ───────────────────────────────────────

  describe('updateNotificationSettings', () => {
    it('merges new settings on top of the existing ones', async () => {
      const user = makeUser({ notificationSettings: { likes: true, comments: true } as any });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updateNotificationSettings(user.id, {
        likes: false,
        messages: true,
      } as any);

      expect(result.notificationSettings).toEqual({ likes: false, comments: true, messages: true });
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ notificationSettings: expect.any(Object) })
      );
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateNotificationSettings('bad-id', {} as any)).rejects.toThrow(
        NotFoundException
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Life event reads / updates ───────────────────────────────────────

  describe('getLifeEvents / updateLifeEvent', () => {
    it('returns the loaded life events', async () => {
      const user = makeUser({ lifeEvents: [{ id: 'ev-1' }] as any });
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.getLifeEvents(user.id);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
        relations: ['lifeEvents'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ev-1');
    });

    it('falls back to an empty list when the relation is unloaded', async () => {
      const user = makeUser({ lifeEvents: undefined as any });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.getLifeEvents(user.id)).resolves.toEqual([]);
    });

    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getLifeEvents('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('applies the update dto to an existing event', async () => {
      const event = { id: 'ev-1', title: 'Old title', type: 'work', date: '2024-01-01' } as any;
      lifeEventRepo.findOneBy.mockResolvedValue(event);
      lifeEventRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.updateLifeEvent('ev-1', { title: 'New title' } as any);

      expect(result.title).toBe('New title');
      expect(lifeEventRepo.save).toHaveBeenCalledWith(event);
    });

    it('throws NotFoundException when the event is missing', async () => {
      lifeEventRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateLifeEvent('bad-id', { title: 'x' } as any)).rejects.toThrow(
        NotFoundException
      );
      expect(lifeEventRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when adding a life event for a missing user', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.addLifeEvent('bad-id', {} as any)).rejects.toThrow(NotFoundException);
      expect(lifeEventRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── Poke reads / returns / dismiss ───────────────────────────────────

  describe('getPokes / returnPoke / dismissPoke', () => {
    it('getPokes returns unreturned pokes for the receiver', async () => {
      const pokes = [{ id: 'poke-1' }] as any;
      pokeRepo.find.mockResolvedValue(pokes);

      await expect(service.getPokes('user-1')).resolves.toBe(pokes);
      expect(pokeRepo.find).toHaveBeenCalledWith({
        where: { receiver: { id: 'user-1' }, isReturned: false },
        relations: ['sender'],
        order: { createdAt: 'DESC' },
      });
    });

    it('returnPoke marks the poke returned and pokes back', async () => {
      const originalSender = makeUser({ id: 'sender-id', username: 'sender' });
      const receiver = makeUser({ id: 'receiver-id', username: 'receiver' });
      const poke: any = { id: 'poke-1', isReturned: false, sender: originalSender };
      pokeRepo.findOne.mockResolvedValue(poke);
      pokeRepo.save.mockResolvedValueOnce(poke).mockResolvedValueOnce({ id: 'poke-2' } as any);
      usersRepo.findOne
        .mockResolvedValueOnce(receiver) // current user lookup
        .mockResolvedValueOnce(originalSender); // original sender lookup
      pokeRepo.create.mockReturnValue({ id: 'poke-2' } as any);

      const result = await service.returnPoke('poke-1', 'receiver-id');

      expect(result.isReturned).toBe(true);
      expect(pokeRepo.create).toHaveBeenCalledWith({
        sender: receiver,
        receiver: originalSender,
        isReturned: false,
      });
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        originalSender,
        NotificationType.POKE,
        expect.objectContaining({ isReturnPoke: true, senderId: receiver.id })
      );
    });

    it('returnPoke still marks the poke when the current user lookup fails', async () => {
      const poke: any = { id: 'poke-1', isReturned: false, sender: { id: 'sender-id' } };
      pokeRepo.findOne.mockResolvedValue(poke);
      pokeRepo.save.mockResolvedValue(poke);
      usersRepo.findOne.mockResolvedValue(null);

      const result = await service.returnPoke('poke-1', 'receiver-id');

      expect(result.isReturned).toBe(true);
      expect(pokeRepo.create).not.toHaveBeenCalled();
      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('returnPoke skips the reciprocal poke when the original sender is gone', async () => {
      const receiver = makeUser({ id: 'receiver-id' });
      const poke: any = { id: 'poke-1', isReturned: false, sender: { id: 'gone-id' } };
      pokeRepo.findOne.mockResolvedValue(poke);
      pokeRepo.save.mockResolvedValue(poke);
      usersRepo.findOne.mockResolvedValueOnce(receiver).mockResolvedValueOnce(null);

      const result = await service.returnPoke('poke-1', 'receiver-id');

      expect(result.isReturned).toBe(true);
      expect(pokeRepo.create).not.toHaveBeenCalled();
      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('returnPoke throws NotFoundException when the poke is missing', async () => {
      pokeRepo.findOne.mockResolvedValue(null);
      await expect(service.returnPoke('missing', 'user-1')).rejects.toThrow(NotFoundException);
      expect(pokeRepo.save).not.toHaveBeenCalled();
    });

    it('dismissPoke marks the poke returned without creating a new one', async () => {
      const poke: any = { id: 'poke-1', isReturned: false };
      pokeRepo.findOne.mockResolvedValue(poke);
      pokeRepo.save.mockImplementation((p: any) => Promise.resolve(p));

      await service.dismissPoke('poke-1', 'user-1');

      expect(poke.isReturned).toBe(true);
      expect(pokeRepo.save).toHaveBeenCalledWith(poke);
      expect(pokeRepo.create).not.toHaveBeenCalled();
    });

    it('dismissPoke throws NotFoundException when the poke is missing', async () => {
      pokeRepo.findOne.mockResolvedValue(null);
      await expect(service.dismissPoke('missing', 'user-1')).rejects.toThrow(NotFoundException);
      expect(pokeRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── Verification: unverify / reject / submit / queue ─────────────────

  describe('verification admin flows', () => {
    it('verifyUser throws NotFoundException when the target is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ id: 'admin-id', role: Role.ADMIN }));
      usersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.verifyUser('missing', 'admin-id')).rejects.toThrow(NotFoundException);
    });

    it('unverifyUser clears the verified flag for admins', async () => {
      const admin = makeUser({ id: 'admin-id', role: Role.ADMIN });
      const user = makeUser({ verified: true, verificationStatus: 'approved' });
      usersRepo.findOne.mockResolvedValueOnce(admin).mockResolvedValueOnce(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.unverifyUser(user.id, admin.id);

      expect(result.verified).toBe(false);
      expect(result.verificationStatus).toBeUndefined();
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('unverifyUser rejects non-admins', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ id: 'user-id', role: Role.USER }));
      await expect(service.unverifyUser('target', 'user-id')).rejects.toThrow(
        'Only admins can unverify users'
      );
    });

    it('unverifyUser throws NotFoundException when the target is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ id: 'admin-id', role: Role.ADMIN }));
      usersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.unverifyUser('missing', 'admin-id')).rejects.toThrow(NotFoundException);
    });

    it('rejectVerification marks the request as rejected for admins', async () => {
      const admin = makeUser({ id: 'admin-id', role: Role.ADMIN });
      const user = makeUser({ verified: false, verificationStatus: 'pending' });
      usersRepo.findOne.mockResolvedValueOnce(admin).mockResolvedValueOnce(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.rejectVerification(user.id, admin.id);

      expect(result.verificationStatus).toBe('rejected');
      expect(result.verified).toBe(false);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('rejectVerification rejects non-admins', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ id: 'user-id', role: Role.USER }));
      await expect(service.rejectVerification('target', 'user-id')).rejects.toThrow(
        'Only admins can reject verification requests'
      );
    });

    it('submitVerification uploads the document and marks the user pending', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));
      const file: any = { buffer: Buffer.from('id-card') };

      const result = await service.submitVerification(user.id, file);

      expect(storageService.upload).toHaveBeenCalledWith(file.buffer);
      expect(result.idDocumentUrl).toBe('https://storage.example.com/file.jpg');
      expect(result.verificationStatus).toBe('pending');
      expect(result.verificationSubmittedAt).toBeInstanceOf(Date);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('submitVerification throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.submitVerification('bad-id', { buffer: Buffer.from('x') } as any)
      ).rejects.toThrow(NotFoundException);
      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('getPendingVerifications returns the pending queue for admins', async () => {
      const admin = makeUser({ id: 'admin-id', role: Role.ADMIN });
      const pending = [makeUser({ verificationStatus: 'pending' })];
      usersRepo.findOne.mockResolvedValue(admin);
      usersRepo.find.mockResolvedValue(pending);

      const result = await service.getPendingVerifications(admin.id);

      expect(result).toBe(pending);
      expect(usersRepo.find).toHaveBeenCalledWith({
        where: { verificationStatus: 'pending' },
        select: [
          'id',
          'username',
          'displayName',
          'email',
          'idDocumentUrl',
          'verificationSubmittedAt',
        ],
      });
    });

    it('getPendingVerifications rejects non-admins', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser({ id: 'user-id', role: Role.USER }));
      await expect(service.getPendingVerifications('user-id')).rejects.toThrow(
        'Only admins can view pending verification requests'
      );
      expect(usersRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── update: image urls & empty payloads ──────────────────────────────

  describe('update profile image urls', () => {
    it('maps avatarUrl and profileHeaderImageUrl onto avatar and header', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.update(user.id, {
        avatarUrl: 'https://cdn.example.com/a.png',
        profileHeaderImageUrl: 'https://cdn.example.com/h.png',
      } as any);

      expect(result.avatar).toBe('https://cdn.example.com/a.png');
      expect(result.header).toBe('https://cdn.example.com/h.png');
      expect(result.profileHeaderImageUrl).toBe('https://cdn.example.com/h.png');
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('returns the user untouched when no supported field is supplied', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.update(user.id, { somethingElse: 'x' } as any);

      expect(result).toBe(user);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile avatar validation', () => {
    it('rejects a non-image avatar before uploading', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.updateProfile('user-id', {} as any, { mimetype: 'video/mp4' } as any)
      ).rejects.toThrow('Avatar must be an image');

      expect(mediaService.uploadFile).not.toHaveBeenCalled();
      expect(usersRepo.save).not.toHaveBeenCalled();
      expect(webhooksService.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  // ─── Misc not-found / no-op branches ──────────────────────────────────

  describe('misc guard branches', () => {
    it('deactivate throws when the account does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.deactivate('bad-id')).rejects.toThrow(NotFoundException);
      expect(loginSessionsRepo.update).not.toHaveBeenCalled();
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('reactivate throws when the account does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.reactivate('bad-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unfollow throws when the follower does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unfollow('bad-id', 'target-id')).rejects.toThrow('Follower not found.');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('block throws when the requester does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.findOneBy.mockResolvedValue(makeUser({ id: 'target-id' }));
      await expect(service.block('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('block throws when the target does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());
      usersRepo.findOneBy.mockResolvedValue(null);
      await expect(service.block('user-id', 'missing-id')).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('unblock throws when the requester does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.unblock('bad-id', 'target-id')).rejects.toThrow(NotFoundException);
    });

    it('createFollowRequest is a no-op when a pending request already exists', async () => {
      const requester = makeUser();
      const recipient = makeUser({ id: 'recipient-id', profilePrivacy: ProfilePrivacy.PRIVATE });
      usersRepo.findOne.mockResolvedValueOnce(requester).mockResolvedValueOnce(recipient);
      followRequestRepo.findOne.mockResolvedValue({ id: 'existing-req' } as any);

      await service.createFollowRequest(requester.id, recipient.id);

      expect(followRequestRepo.create).not.toHaveBeenCalled();
      expect(followRequestRepo.save).not.toHaveBeenCalled();
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('updateCloseFriends throws when the user does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateCloseFriends('bad-id', [])).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('findOneWithPosts returns undefined for an unknown id', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneWithPosts('missing', 'viewer-id')).resolves.toBeUndefined();
      expect(postsRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── discoverContacts: phone numbers ──────────────────────────────────

  describe('discoverContacts with phone numbers', () => {
    it('normalizes a punctuated phone number and queries phone matches', async () => {
      const match = makeUser({ id: 'phone-match' });
      usersRepo.find.mockResolvedValue([match]);

      const result = await service.discoverContacts('me-id', { contacts: ['+1 (555) 123-4567'] });

      expect(usersRepo.find).toHaveBeenCalledWith({
        where: [
          { email: expect.any(Object), contactDiscovery: true },
          { phoneNumber: expect.any(Object), contactDiscovery: true },
        ],
      });
      const arg: any = usersRepo.find.mock.calls[0][0];
      expect(arg.where[1].phoneNumber.value).toEqual(['+15551234567']);
      expect(result).toEqual([
        {
          id: 'phone-match',
          username: 'testuser',
          displayName: 'Test User',
          avatar: '/uploads/avatars/test.jpg',
        },
      ]);
    });

    it('skips contacts that are neither valid emails nor phone numbers', async () => {
      const result = await service.discoverContacts('me-id', { contacts: ['123', 'not-an-email'] });

      expect(result).toEqual([]);
      expect(usersRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── pokeUser guard branches ──────────────────────────────────────────

  describe('pokeUser guard branches', () => {
    it('throws NotFoundException when a participant is missing', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.pokeUser('a', 'b')).rejects.toThrow(NotFoundException);
      expect(pokeRepo.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the receiver blocked the sender', async () => {
      const sender = makeUser();
      const receiver = makeUser({ id: 'receiver-id', blockedUsers: [{ id: sender.id }] as any });
      usersRepo.findOne
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver)
        .mockResolvedValueOnce(receiver);

      await expect(service.pokeUser(sender.id, receiver.id)).rejects.toThrow(ForbiddenException);
      expect(pokeRepo.create).not.toHaveBeenCalled();
      expect(pokeRepo.findOne).not.toHaveBeenCalled();
    });

    it('marks an unreturned poke from the other side as returned first', async () => {
      const sender = makeUser();
      const receiver = makeUser({ id: 'receiver-id' });
      const backPoke: any = { id: 'back-1', isReturned: false };
      usersRepo.findOne
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver)
        .mockResolvedValueOnce(makeUser({ blockedUsers: [] }));
      pokeRepo.findOne.mockResolvedValue(backPoke);
      pokeRepo.save.mockImplementation((p: any) => Promise.resolve(p));
      pokeRepo.create.mockReturnValue({ id: 'new-poke' } as any);

      const result = await service.pokeUser(sender.id, receiver.id);

      expect(backPoke.isReturned).toBe(true);
      expect(pokeRepo.save).toHaveBeenCalledWith(backPoke);
      expect(result.id).toBe('new-poke');
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        receiver,
        NotificationType.POKE,
        expect.objectContaining({ pokeId: 'new-poke' })
      );
    });
  });

  // ─── updatePrivacy: every supported field ─────────────────────────────

  describe('updatePrivacy full payload', () => {
    it('applies every supported privacy field and merges nested objects', async () => {
      const user = makeUser({
        personalizationControls: { feedPersonalization: true, recommendations: true } as any,
        screenshotProtection: { enabled: false, level: 'warning_only', applyToDms: true } as any,
      });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updatePrivacy(user.id, {
        profilePrivacy: ProfilePrivacy.PRIVATE,
        postVisibility: 'friends' as any,
        friendRequestPrivacy: 'everyone' as any,
        emailSearchPrivacy: 'friends' as any,
        commentPrivacy: 'everyone' as any,
        tagPrivacy: 'everyone' as any,
        messagePrivacy: 'everyone' as any,
        showOnlineStatus: false,
        showLastSeenTimestamp: false,
        readReceipts: false,
        contactDiscovery: false,
        personalization: false,
        adPersonalization: false,
        personalizationControls: { feedPersonalization: false },
        mentions: 'everyone' as any,
        activityVisibility: 'public' as any,
        storyVisibility: 'public' as any,
        searchVisibility: 'everyone' as any,
        screenshotProtection: { enabled: true } as any,
      } as any);

      expect(result.profilePrivacy).toBe(ProfilePrivacy.PRIVATE);
      expect(result.postVisibility).toBe('friends');
      expect(result.friendRequestPrivacy).toBe('everyone');
      expect(result.emailSearchPrivacy).toBe('friends');
      expect(result.commentPrivacy).toBe('everyone');
      expect(result.tagPrivacy).toBe('everyone');
      expect(result.messagePrivacy).toBe('everyone');
      expect(result.showOnlineStatus).toBe(false);
      expect(result.showLastSeenTimestamp).toBe(false);
      expect(result.readReceipts).toBe(false);
      expect(result.contactDiscovery).toBe(false);
      expect(result.personalization).toBe(false);
      expect(result.adPersonalization).toBe(false);
      expect(result.mentions).toBe('everyone');
      expect(result.activityVisibility).toBe('public');
      expect(result.storyVisibility).toBe('public');
      expect(result.searchVisibility).toBe('everyone');
      expect(result.personalizationControls).toEqual({
        feedPersonalization: false,
        recommendations: true,
        searchPersonalization: true,
        notificationPersonalization: true,
        creatorPersonalization: true,
        communityPersonalization: true,
        shoppingPersonalization: true,
        eventPersonalization: true,
        locationPersonalization: true,
        activityPersonalization: true,
      });
      expect(result.screenshotProtection).toEqual({
        enabled: true,
        level: 'warning_only',
        applyToDms: true,
      });
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('merges controls and screenshot protection onto defaults when unset', async () => {
      const user = makeUser({
        personalizationControls: undefined as any,
        screenshotProtection: undefined as any,
      });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updatePrivacy(user.id, {
        personalizationControls: { recommendations: false } as any,
        screenshotProtection: { level: 'block_all' } as any,
      } as any);

      expect(result.personalizationControls).toEqual(
        expect.objectContaining({ recommendations: false })
      );
      expect(result.personalizationControls).toEqual(
        expect.objectContaining({ feedPersonalization: true })
      );
      expect(result.screenshotProtection).toEqual({ level: 'block_all' });
    });
  });

  // ─── delete: asset cleanup without a transaction ──────────────────────

  describe('delete asset cleanup', () => {
    it('skips cleanup entirely when the user has no avatar', async () => {
      const user = makeUser({ avatar: null });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.remove.mockResolvedValue(user);

      await service.delete(user.id);

      expect(storageService.delete).not.toHaveBeenCalled();
      expect(usersRepo.remove).toHaveBeenCalledWith(user);
    });

    it('keeps going when external storage cleanup fails', async () => {
      const user = makeUser({ avatar: 'storage/avatars/key.jpg' });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.remove.mockResolvedValue(user);
      storageService.delete.mockRejectedValue(new Error('storage unavailable'));

      await service.delete(user.id);

      expect(storageService.delete).toHaveBeenCalledWith('storage/avatars/key.jpg');
      expect(usersRepo.remove).toHaveBeenCalledWith(user);
    });
  });

  // ─── delete: transactional path ───────────────────────────────────────

  describe('delete with a transactional dataSource', () => {
    const makeQueryRunner = () => ({
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
      query: jest.fn(),
    });

    function buildTxService(qr: any): UsersService {
      return new UsersService(
        usersRepo as any,
        postsRepo as any,
        followRequestRepo as any,
        pokeRepo as any,
        lifeEventRepo as any,
        loginSessionsRepo as any,
        notificationsService as any,
        storageService as any,
        mediaService as any,
        webhooksService as any,
        dataPermissions as any,
        { createQueryRunner: () => qr } as any
      );
    }

    it('sweeps owned rows, skips rows without a row count and commits', async () => {
      const qr = makeQueryRunner();
      const user = makeUser({ avatar: 'storage/avatars/key.jpg' });
      qr.manager.findOne.mockResolvedValue(user);
      qr.manager.remove.mockResolvedValue(user);
      qr.query
        .mockResolvedValueOnce([{ table_name: 'posts', column_name: 'userId' }]) // ownership scan
        .mockResolvedValueOnce({ rowCount: 2 }) // pass 0: deleted something
        .mockResolvedValueOnce({}); // pass 1: rowCount is null → treated as 0 → stop

      await buildTxService(qr).delete(user.id);

      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.update).toHaveBeenCalledWith(
        LoginSession,
        { user: { id: user.id } },
        { revokedAt: expect.any(Date) }
      );
      expect(qr.query.mock.calls[1][0]).toContain('DELETE FROM "posts"');
      expect(qr.query.mock.calls[1][1]).toEqual([user.id]);
      expect(qr.manager.remove).toHaveBeenCalledWith(user);
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(storageService.delete).toHaveBeenCalledWith('storage/avatars/key.jpg');
    });

    it('swallows foreign key violations while sweeping and commits', async () => {
      const qr = makeQueryRunner();
      const user = makeUser();
      qr.manager.findOne.mockResolvedValue(user);
      qr.manager.remove.mockResolvedValue(user);
      qr.query
        .mockResolvedValueOnce([{ table_name: 'comments', column_name: 'authorId' }])
        .mockRejectedValueOnce({ code: '23503' });

      await buildTxService(qr).delete(user.id);

      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it('stops the sweep when no ownership columns exist', async () => {
      const qr = makeQueryRunner();
      const user = makeUser({ avatar: null });
      qr.manager.findOne.mockResolvedValue(user);
      qr.manager.remove.mockResolvedValue(user);
      qr.query.mockResolvedValueOnce([]);

      await buildTxService(qr).delete(user.id);

      expect(qr.query).toHaveBeenCalledTimes(1);
      expect(qr.manager.remove).toHaveBeenCalledWith(user);
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows unexpected sweep errors', async () => {
      const qr = makeQueryRunner();
      const user = makeUser();
      qr.manager.findOne.mockResolvedValue(user);
      qr.query
        .mockResolvedValueOnce([{ table_name: 'posts', column_name: 'userId' }])
        .mockRejectedValueOnce({ code: '40001', message: 'serialization failure' });

      await expect(buildTxService(qr).delete(user.id)).rejects.toEqual({
        code: '40001',
        message: 'serialization failure',
      });

      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).not.toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(qr.manager.remove).not.toHaveBeenCalled();
    });

    it('rolls back when the user does not exist', async () => {
      const qr = makeQueryRunner();
      qr.manager.findOne.mockResolvedValue(null);

      await expect(buildTxService(qr).delete('missing')).rejects.toThrow(NotFoundException);

      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.query).not.toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });
  });

  // ─── Remaining branch seams ───────────────────────────────────────────

  describe('remaining branch seams', () => {
    it('toSearchUserResponse falls back to the default of includeEmail', () => {
      const user = makeUser({ email: 'default@example.com' });
      expect(toSearchUserResponse(user)).not.toHaveProperty('email');
      expect(toSearchUserResponse(user, true).email).toBe('default@example.com');
    });

    it('updatePrivacy throws when the account no longer exists', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePrivacy('bad-id', {} as any)).rejects.toThrow(NotFoundException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('update accepts a username lookup that resolves to null', async () => {
      const user = makeUser({ username: 'renamed' });
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.update(user.id, { username: 'renamed' } as any);

      expect(result.username).toBe('renamed');
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('update allows keeping the current username', async () => {
      const user = makeUser({ username: 'current' });
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      usersRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.update(user.id, { username: 'current' } as any);

      expect(result).toBe(user);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('delete never unlinks upload paths that escape the uploads root', async () => {
      const user = makeUser({ avatar: '/uploads/../secret.jpg' });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.remove.mockResolvedValue(user);

      await service.delete(user.id);

      expect(storageService.delete).not.toHaveBeenCalled();
      expect(usersRepo.remove).toHaveBeenCalledWith(user);
    });

    it('discoverContacts drops entries that normalize to an empty string', async () => {
      usersRepo.find.mockResolvedValue([makeUser({ id: 'valid-id' })]);

      const result = await service.discoverContacts('me-id', {
        contacts: ['   ', 'valid@example.com'],
      });

      const arg: any = usersRepo.find.mock.calls[0][0];
      expect(arg.where[0].email.value).toEqual(['valid@example.com']);
      expect(result.map((u) => u.id)).toEqual(['valid-id']);
    });

    it('findFollowSuggestions skips the query builder when the user follows nobody', async () => {
      const user = makeUser({ following: [] });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.find.mockResolvedValue([makeUser({ id: 'recent-1' })]);

      const suggestions = await service.findFollowSuggestions(user.id);

      expect(usersRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(suggestions.map((s) => s.id)).toEqual(['recent-1']);
    });

    it('findFollowSuggestions skips the recency fill when candidates already fill the list', async () => {
      const user = makeUser({ following: [{ id: 'friend-1' }] as any });
      usersRepo.findOne.mockResolvedValue(user);
      const candidates = Array.from({ length: 10 }, (_, i) => ({ id: `cand-${i}` }));
      const qb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(candidates),
      } as any;
      usersRepo.createQueryBuilder.mockReturnValue(qb);
      usersRepo.find.mockResolvedValue(candidates.map((c) => makeUser({ id: c.id })));

      const suggestions = await service.findFollowSuggestions(user.id);

      expect(suggestions).toHaveLength(10);
      expect(usersRepo.find).toHaveBeenCalledTimes(1);
      expect(usersRepo.find).toHaveBeenCalledWith({ where: { id: expect.anything() } });
    });

    it('rejectVerification throws NotFoundException when the target is missing', async () => {
      usersRepo.findOne.mockResolvedValueOnce(makeUser({ id: 'admin-id', role: Role.ADMIN }));
      usersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.rejectVerification('missing', 'admin-id')).rejects.toThrow(
        NotFoundException
      );
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });
});
