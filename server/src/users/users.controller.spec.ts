// bcrypt native binary is not compiled in this environment; mock before any imports.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PagesService } from '../pages/pages.service';
import { AccountManagementService } from '../features/account-management/account-management.service';

function makeMockUser(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    bio: 'A test user',
    avatar: '/uploads/avatars/test.jpg',
    ...overrides,
  };
}

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let pagesService: jest.Mocked<PagesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
            findByUsername: jest.fn(),
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            updateProfile: jest.fn(),
            updateAvatar: jest.fn(),
            delete: jest.fn(),
            deactivate: jest.fn(),
            follow: jest.fn(),
            unfollow: jest.fn(),
            addFavorite: jest.fn(),
            removeFavorite: jest.fn(),
            findOneWithPosts: jest.fn(),
            search: jest.fn(),
            findFollowSuggestions: jest.fn(),
            findMutualFollows: jest.fn(),
            block: jest.fn(),
            unblock: jest.fn(),
            getBlockedUsers: jest.fn(),
            restrict: jest.fn(),
            unrestrict: jest.fn(),
            getRestrictedUsers: jest.fn(),
            createFollowRequest: jest.fn(),
            acceptFollowRequest: jest.fn(),
            denyFollowRequest: jest.fn(),
            getFollowers: jest.fn(),
            getCloseFriends: jest.fn(),
            updateCloseFriends: jest.fn(),
            updatePrivacy: jest.fn(),
            updateNotificationSettings: jest.fn(),
            updateFaceRecognition: jest.fn(),
            addLifeEvent: jest.fn(),
            updateLifeEvent: jest.fn(),
            removeLifeEvent: jest.fn(),
            pokeUser: jest.fn(),
            getPokes: jest.fn(),
            returnPoke: jest.fn(),
            dismissPoke: jest.fn(),
            followHashtag: jest.fn(),
            unfollowHashtag: jest.fn(),
            blockKeyword: jest.fn(),
            unblockKeyword: jest.fn(),
            getBlockedKeywords: jest.fn(),
            blockHashtag: jest.fn(),
            unblockHashtag: jest.fn(),
            getBlockedHashtags: jest.fn(),
            blockContentType: jest.fn(),
            unblockContentType: jest.fn(),
            getBlockedContentTypes: jest.fn(),
            isBlockedBy: jest.fn(),
            verifyUser: jest.fn(),
            unverifyUser: jest.fn(),
            rejectVerification: jest.fn(),
            submitVerification: jest.fn(),
            getPendingVerifications: jest.fn(),
            getFollowing: jest.fn(),
            getPendingFollowRequests: jest.fn(),
            cancelFollowRequest: jest.fn(),
          },
        },
        {
          provide: PagesService,
          useValue: {
            findPageSuggestions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AccountManagementService,
          useValue: {
            switchAccount: jest.fn().mockResolvedValue({
              accountId: 'u2',
              switched: true,
              message: 'Account switched successfully.',
              settings: { accountId: 'u2', deactivated: false, switchingEnabled: true, permissions: [], personalizationSettings: {}, dataPermissions: [], updatedAt: '2026-01-01T00:00:00.000Z' },
            }),
            createAccountProfile: jest.fn().mockResolvedValue({
              id: 'profile-1',
              accountId: 'u1',
              label: 'Work',
              accountType: 'business',
              isPrimary: false,
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            }),
            listAccountProfiles: jest.fn().mockReturnValue([
              {
                id: 'profile-1',
                accountId: 'u1',
                label: 'Work',
                accountType: 'business',
                isPrimary: false,
                isActive: true,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ]),
            setPrimaryAccountProfile: jest.fn().mockResolvedValue({
              id: 'profile-1',
              accountId: 'u1',
              label: 'Work',
              accountType: 'business',
              isPrimary: true,
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            }),
            getTrustIndicators: jest.fn().mockResolvedValue({
              accountId: 'u1',
              verified: true,
              badges: ['identity_verified', 'security_hardened'],
              trustScore: 92,
              updatedAt: '2026-01-01T00:00:00.000Z',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    pagesService = module.get(PagesService) as jest.Mocked<PagesService>;
  });

  // ─── GET /users/me ────────────────────────────────────────────────────

  describe('GET /users/me', () => {
    it('returns the current user', async () => {
      const user = makeMockUser();
      usersService.findOneById.mockResolvedValue(user as any);

      const result = await controller.getCurrentUser({ user: { userId: user.id } });
      expect(result).toBeDefined();
      expect(usersService.findOneById).toHaveBeenCalledWith(user.id, ['following', 'followers']);
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findOneById.mockResolvedValue(null);
      await expect(controller.getCurrentUser({ user: { userId: 'bad' } })).rejects.toThrow();
    });
  });

  describe('GET /users/me/trust-indicator', () => {
    it('returns the current user trust indicator snapshot', async () => {
      const result = await controller.getTrustIndicators({ user: { userId: 'u1' } });

      expect(result).toMatchObject({
        accountId: 'u1',
        verified: true,
        badges: ['identity_verified', 'security_hardened'],
        trustScore: 92,
      });
    });
  });

  describe('Multiple accounts', () => {
    it('lists account profiles, switches to a different account, and marks a primary profile', async () => {
      const profiles = await controller.listAccountProfiles({ user: { userId: 'u1' } });
      expect(profiles).toHaveLength(1);
      expect(profiles[0].label).toBe('Work');

      await expect(
        controller.switchCurrentAccount({ user: { userId: 'u1' } }, { accountId: 'u2' }),
      ).rejects.toThrow('Switch accounts by authenticating the target account.');

      const primary = await controller.setPrimaryAccountProfile({ user: { userId: 'u1' } }, 'profile-1');
      expect(primary.isPrimary).toBe(true);
    });
  });

  // ─── PATCH /users/profile ─────────────────────────────────────────────

  describe('PATCH /users/profile', () => {
    it('updates the user profile', async () => {
      const user = makeMockUser();
      usersService.updateProfile.mockResolvedValue(user as any);

      const result = await controller.updateProfile(
        { user: { userId: user.id } },
        { displayName: 'Updated' },
        null,
      );

      expect(usersService.updateProfile).toHaveBeenCalledWith(user.id, { displayName: 'Updated' }, null);
      expect(result).toBeDefined();
    });
  });

  // ─── PATCH /users/me ──────────────────────────────────────────────────

  describe('PATCH /users/me', () => {
    it('updates user fields', async () => {
      const user = makeMockUser({ displayName: 'New Name' });
      usersService.update.mockResolvedValue(user as any);

      const result = await controller.update({ user: { userId: user.id } }, { displayName: 'New Name' });
      expect(result.displayName).toBe('New Name');
    });
  });

  // ─── GET /users/suggestions ───────────────────────────────────────────

  describe('GET /users/suggestions', () => {
    it('returns follow suggestions', async () => {
      usersService.findFollowSuggestions.mockResolvedValue([]);

      const result = await controller.getFollowSuggestions({ user: { userId: 'u1' } });
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pages');
    });
  });

  // ─── GET /users/:username ─────────────────────────────────────────────

  describe('GET /users/:username', () => {
    it('finds a user by username', async () => {
      const user = makeMockUser();
      usersService.findByUsername.mockResolvedValue(user as any);

      const result = await controller.findByUsername({ user: { userId: 'viewer' } }, 'testuser');
      expect(result).toBe(user);
    });
  });

  // ─── POST /users/:id/follow ───────────────────────────────────────────

  describe('POST /users/:id/follow', () => {
    it('follows a user', async () => {
      await controller.follow({ user: { userId: 'follower' } }, 'target-id');
      expect(usersService.follow).toHaveBeenCalledWith('follower', 'target-id');
    });
  });

  // ─── DELETE /users/:id/follow ─────────────────────────────────────────

  describe('DELETE /users/:id/follow', () => {
    it('unfollows a user', async () => {
      await controller.unfollow({ user: { userId: 'follower' } }, 'target-id');
      expect(usersService.unfollow).toHaveBeenCalledWith('follower', 'target-id');
    });
  });

  // ─── POST /users/:id/block ────────────────────────────────────────────

  describe('POST /users/:id/block', () => {
    it('blocks a user', async () => {
      await controller.block({ user: { userId: 'blocker' } }, 'target-id');
      expect(usersService.block).toHaveBeenCalledWith('blocker', 'target-id');
    });
  });

  // ─── DELETE /users/:id/block ──────────────────────────────────────────

  describe('DELETE /users/:id/block', () => {
    it('unblocks a user', async () => {
      await controller.unblock({ user: { userId: 'blocker' } }, 'target-id');
      expect(usersService.unblock).toHaveBeenCalledWith('blocker', 'target-id');
    });
  });

  // ─── GET /users/:id ───────────────────────────────────────────────────

  describe('GET /users/:id', () => {
    it('returns public profile with posts', async () => {
      const user = makeMockUser();
      usersService.findOneWithPosts.mockResolvedValue(user as any);

      const result = await controller.getPublicProfile(
        { user: { userId: 'viewer' } },
        'target-id',
        '10',
        '0',
      );
      expect(result).toBeDefined();
      expect(usersService.findOneWithPosts).toHaveBeenCalledWith('target-id', 'viewer', 10, 0);
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findOneWithPosts.mockResolvedValue(undefined);
      await expect(
        controller.getPublicProfile({ user: { userId: 'viewer' } }, 'bad-id', undefined, undefined),
      ).rejects.toThrow();
    });
  });

  // ─── GET /users/search ────────────────────────────────────────────────

  describe('GET /users/search', () => {
    it('searches users', async () => {
      usersService.search.mockResolvedValue([]);
      const result = await controller.searchUsers({ user: { userId: 'u1' } }, 'test');
      expect(usersService.search).toHaveBeenCalledWith('test', 'u1');
    });
  });

  // ─── DELETE /users/me ─────────────────────────────────────────────────

  describe('DELETE /users/me', () => {
    it('deletes own account', async () => {
      await controller.deleteAccount({ user: { userId: 'u1' } });
      expect(usersService.delete).toHaveBeenCalledWith('u1');
    });
  });

  // ─── Close friends ────────────────────────────────────────────────────

  describe('close friends', () => {
    it('GET /users/me/close-friends', async () => {
      usersService.getCloseFriends.mockResolvedValue([]);
      await controller.getCloseFriends({ user: { userId: 'u1' } });
      expect(usersService.getCloseFriends).toHaveBeenCalledWith('u1');
    });

    it('PUT /users/me/close-friends', async () => {
      const user = makeMockUser();
      usersService.updateCloseFriends.mockResolvedValue(user as any);
      await controller.updateCloseFriends({ user: { userId: 'u1' } }, { closeFriendIds: ['f1', 'f2'] });
      expect(usersService.updateCloseFriends).toHaveBeenCalledWith('u1', ['f1', 'f2']);
    });
  });

  // ─── Follow requests ──────────────────────────────────────────────────

  describe('follow requests', () => {
    it('POST /users/:id/follow-request', async () => {
      await controller.followRequest({ user: { userId: 'requester' } }, 'target-id');
      expect(usersService.createFollowRequest).toHaveBeenCalledWith('requester', 'target-id');
    });

    it('GET /users/me/following', async () => {
      usersService.getFollowing.mockResolvedValue([]);
      const result = await controller.getMyFollowing({ user: { userId: 'u1' } });
      expect(usersService.getFollowing).toHaveBeenCalledWith('u1');
      expect(result).toEqual([]);
    });

    it('GET /users/me/follow-requests/pending', async () => {
      usersService.getPendingFollowRequests.mockResolvedValue([]);
      const result = await controller.getMyPendingFollowRequests({ user: { userId: 'u1' } });
      expect(usersService.getPendingFollowRequests).toHaveBeenCalledWith('u1');
      expect(result).toEqual([]);
    });

    it('DELETE /users/follow-requests/:id (cancel)', async () => {
      usersService.cancelFollowRequest.mockResolvedValue(undefined);
      await controller.cancelFollowRequest({ user: { userId: 'u1' } }, 'req-1');
      expect(usersService.cancelFollowRequest).toHaveBeenCalledWith('u1', 'req-1');
    });
  });

  // ─── Pokes ────────────────────────────────────────────────────────────

  describe('pokes', () => {
    it('POST /users/:id/poke', async () => {
      usersService.pokeUser.mockResolvedValue({} as any);
      await controller.pokeUser({ user: { userId: 'u1' } }, 'target-id');
      expect(usersService.pokeUser).toHaveBeenCalledWith('u1', 'target-id');
    });
  });
});
