// bcrypt native binary is not compiled in this environment; mock before any imports.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { UsersController } from './users.controller';
import * as usersMappers from './users.service';
import { UsersService } from './users.service';
import { PagesService } from '../pages/pages.service';
import { AccountManagementService } from '../features/account-management/account-management.service';
import { VisibilityService } from '../common/visibility/visibility.service';

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
  let accountManagementService: jest.Mocked<AccountManagementService>;
  let visibilityService: jest.Mocked<VisibilityService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: VisibilityService,
          useValue: { canViewActivity: jest.fn().mockResolvedValue(true) },
        },
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
            setBirthDate: jest.fn(),
            getAgeVerificationStatus: jest.fn(),
            reactivate: jest.fn(),
            mute: jest.fn(),
            unmute: jest.fn(),
            getMutedUsers: jest.fn(),
            cancelFollowRequestByUser: jest.fn(),
            getUserFollowers: jest.fn(),
            getUserFollowing: jest.fn(),
            discoverContacts: jest.fn(),
            getLifeEvents: jest.fn(),
            getPrivacy: jest.fn(),
            resetPersonalizationControls: jest.fn(),
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
              settings: {
                accountId: 'u2',
                deactivated: false,
                switchingEnabled: true,
                permissions: [],
                personalizationSettings: {},
                dataPermissions: [],
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
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
            switchAccountProfile: jest.fn(),
            getAccountDashboard: jest.fn(),
            getSecurityCenter: jest.fn(),
            getAccountHistory: jest.fn(),
            exportSecurityLog: jest.fn(),
            linkAccount: jest.fn(),
            unlinkAccount: jest.fn(),
            startAccountRecovery: jest.fn(),
            completeAccountRecovery: jest.fn(),
            submitVerificationAppeal: jest.fn(),
            requestIdentityVerification: jest.fn(),
            requestCreatorVerification: jest.fn(),
            requestBusinessVerification: jest.fn(),
            requestOrganizationVerification: jest.fn(),
            getVerificationStatus: jest.fn(),
            getVerificationHistory: jest.fn(),
            resolveSecurityAlert: jest.fn(),
            reviewLoginApproval: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    pagesService = module.get(PagesService) as jest.Mocked<PagesService>;
    accountManagementService = module.get(
      AccountManagementService
    ) as jest.Mocked<AccountManagementService>;
    visibilityService = module.get(VisibilityService) as jest.Mocked<VisibilityService>;
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
        controller.switchCurrentAccount({ user: { userId: 'u1' } }, { accountId: 'u2' })
      ).rejects.toThrow('Switch accounts by authenticating the target account.');

      const primary = await controller.setPrimaryAccountProfile(
        { user: { userId: 'u1' } },
        'profile-1'
      );
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
        null
      );

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        user.id,
        { displayName: 'Updated' },
        null
      );
      expect(result).toBeDefined();
    });
  });

  // ─── PATCH /users/me ──────────────────────────────────────────────────

  describe('PATCH /users/me', () => {
    it('updates user fields', async () => {
      const user = makeMockUser({ displayName: 'New Name' });
      usersService.update.mockResolvedValue(user as any);

      const result = await controller.update(
        { user: { userId: user.id } },
        { displayName: 'New Name' }
      );
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
      expect(result).toMatchObject({
        id: user.id,
        username: 'testuser',
        displayName: 'Test User',
        avatar: '/uploads/avatars/test.jpg',
        bio: 'A test user',
      });
      // The public profile DTO must never leak the account email.
      expect(result).not.toHaveProperty('email');
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
        '0'
      );
      expect(result).toBeDefined();
      expect(usersService.findOneWithPosts).toHaveBeenCalledWith('target-id', 'viewer', 10, 0);
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findOneWithPosts.mockResolvedValue(undefined);
      await expect(
        controller.getPublicProfile({ user: { userId: 'viewer' } }, 'bad-id', undefined, undefined)
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
      await controller.updateCloseFriends(
        { user: { userId: 'u1' } },
        { closeFriendIds: ['f1', 'f2'] }
      );
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

  // ─── Extended coverage for previously uncovered handlers ─────────────

  describe('extended coverage', () => {
    const authReq = (userId = 'u1'): any => ({ user: { userId } });

    function interceptorInstance(method: string): any {
      const reflect: any = Reflect;
      const interceptors: any[] =
        reflect.getMetadata('__interceptors__', (UsersController.prototype as any)[method]) || [];
      expect(interceptors).toHaveLength(1);
      return new interceptors[0]();
    }

    function runFileFilter(method: string, file: any): jest.Mock {
      const filter = interceptorInstance(method).multer.fileFilter;
      const cb = jest.fn();
      filter(authReq(), file, cb);
      return cb;
    }

    function expectFilterRejected(cb: jest.Mock): void {
      expect(cb).toHaveBeenCalledTimes(1);
      const error = cb.mock.calls[0][0];
      const accepted = cb.mock.calls[0][1];
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Avatar must be an image');
      expect(accepted).toBe(false);
    }

    function multipartRequest(contentType?: string): any {
      const boundary = '----usersCtrlBoundary42';
      const parts = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="doc.png"',
      ];
      if (contentType) {
        parts.push(`Content-Type: ${contentType}`);
      }
      parts.push('', 'file-bytes', `--${boundary}--`, '');
      const body = Buffer.from(parts.join('\r\n'), 'utf8');
      const stream: any = Readable.from([body]);
      stream.headers = {
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'content-length': String(body.length),
      };
      return stream;
    }

    async function uploadThroughInterceptor(method: string, contentType?: string): Promise<any> {
      const interceptor = interceptorInstance(method);
      const request = multipartRequest(contentType);
      const response: any = {};
      const finished = new Promise<void>((resolve, reject) => {
        interceptor.multer.any()(request, response, (err: any) => (err ? reject(err) : resolve()));
      });
      request.resume();
      await finished;
      return request;
    }

    // ── multer file filters registered on the upload routes ────────────

    describe('multer avatar file filters', () => {
      it('accepts image uploads on POST /users/me/avatar', () => {
        const cb = runFileFilter('uploadAvatar', { mimetype: 'image/png' });
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('rejects non-image uploads on POST /users/me/avatar', () => {
        expectFilterRejected(runFileFilter('uploadAvatar', { mimetype: 'application/pdf' }));
      });

      it('rejects uploads without a mimetype on POST /users/me/avatar', () => {
        expectFilterRejected(runFileFilter('uploadAvatar', { filename: 'doc.png' }));
      });

      it('accepts image uploads on PATCH /users/profile', () => {
        const cb = runFileFilter('updateProfile', { mimetype: 'image/jpeg' });
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('rejects non-image uploads on PATCH /users/profile', () => {
        expectFilterRejected(runFileFilter('updateProfile', { mimetype: 'text/html' }));
      });

      it('wires the avatar filter through multer end to end', async () => {
        const request = await uploadThroughInterceptor('uploadAvatar', 'image/png');
        expect(request.files).toHaveLength(1);
        expect(request.files[0]).toMatchObject({
          fieldname: 'file',
          originalname: 'doc.png',
          mimetype: 'image/png',
        });
      });

      it('surfaces filter rejections through multer end to end', async () => {
        await expect(uploadThroughInterceptor('updateProfile', 'text/plain')).rejects.toThrow(
          'Avatar must be an image'
        );
      });
    });

    // ── self-service profile helpers ───────────────────────────────────

    describe('POST /users/me/avatar', () => {
      it('delegates to updateAvatar and returns the self response', async () => {
        const user = makeMockUser();
        const file: any = { buffer: Buffer.from('png'), mimetype: 'image/png' };
        usersService.updateAvatar.mockResolvedValue(user as any);

        const result = await controller.uploadAvatar(authReq(user.id), file);

        expect(usersService.updateAvatar).toHaveBeenCalledWith(user.id, file);
        expect(result).toMatchObject({ id: user.id, email: user.email });
      });

      it('propagates avatar upload failures', async () => {
        usersService.updateAvatar.mockRejectedValue(new BadRequestException('Avatar too large.'));

        await expect(
          controller.uploadAvatar(authReq('u1'), { buffer: Buffer.from('x') } as any)
        ).rejects.toThrow('Avatar too large.');
      });
    });

    describe('PATCH /users/me/face-recognition', () => {
      it('updates face recognition settings', async () => {
        const user = makeMockUser({ faceRecognitionEnabled: true });
        usersService.updateFaceRecognition.mockResolvedValue(user as any);

        const result = await controller.updateFaceRecognition(authReq(user.id), {
          isFaceRecognitionEnabled: true,
        } as any);

        expect(usersService.updateFaceRecognition).toHaveBeenCalledWith(user.id, {
          isFaceRecognitionEnabled: true,
        });
        expect(result).toMatchObject({ id: user.id, email: user.email });
      });
    });

    describe('birth date and age verification', () => {
      it('POST /users/me/birth-date stores the birth date', async () => {
        usersService.setBirthDate.mockResolvedValue(
          makeMockUser({ birthDate: '2000-01-01' }) as any
        );

        const result = await controller.setBirthDate(authReq('u1'), { birthDate: '2000-01-01' });

        expect(usersService.setBirthDate).toHaveBeenCalledWith('u1', '2000-01-01');
        expect(result).toMatchObject({ id: makeMockUser().id, birthDate: '2000-01-01' });
      });

      it('GET /users/me/age-verification-status returns the status', async () => {
        usersService.getAgeVerificationStatus.mockResolvedValue({
          status: 'verified',
          verifiedAt: '2026-01-01T00:00:00.000Z',
        } as any);

        const result = await controller.ageVerificationStatus(authReq('u1'));

        expect(usersService.getAgeVerificationStatus).toHaveBeenCalledWith('u1');
        expect(result).toMatchObject({ status: 'verified' });
      });

      it('POST /users/me/age-verification-request reuses setBirthDate', async () => {
        usersService.setBirthDate.mockResolvedValue(
          makeMockUser({ birthDate: '1999-12-31' }) as any
        );

        const result = await controller.requestAgeVerification(authReq('u1'), {
          birthDate: '1999-12-31',
        });

        expect(usersService.setBirthDate).toHaveBeenCalledWith('u1', '1999-12-31');
        expect(result).toMatchObject({ birthDate: '1999-12-31' });
      });
    });

    // ── account lifecycle ──────────────────────────────────────────────

    describe('account lifecycle', () => {
      it('POST /users/deactivate forwards the reason and status', async () => {
        usersService.deactivate.mockResolvedValue({
          id: 'u1',
          status: 'deactivated',
        } as any);

        const result = await controller.deactivate(authReq('u1'), { reason: 'taking a break' });

        expect(usersService.deactivate).toHaveBeenCalledWith('u1', 'taking a break');
        expect(result).toEqual({
          userId: 'u1',
          status: 'deactivated',
          message: 'Account deactivated successfully.',
        });
      });

      it('POST /users/deactivate works without a body or status', async () => {
        usersService.deactivate.mockResolvedValue({ id: 'u1' } as any);

        const result = await controller.deactivate(authReq('u1'));

        expect(usersService.deactivate).toHaveBeenCalledWith('u1', undefined);
        expect(result).toEqual({
          userId: 'u1',
          status: 'deactivated',
          message: 'Account deactivated successfully.',
        });
      });

      it('POST /users/reactivate returns the active status', async () => {
        usersService.reactivate.mockResolvedValue({ id: 'u1', status: 'active' } as any);

        const result = await controller.reactivate(authReq('u1'));

        expect(usersService.reactivate).toHaveBeenCalledWith('u1');
        expect(result).toEqual({
          userId: 'u1',
          status: 'active',
          message: 'Account reactivated successfully.',
        });
      });

      it('POST /users/reactivate defaults the status when the service omits it', async () => {
        usersService.reactivate.mockResolvedValue({ id: 'u1' } as any);

        const result = await controller.reactivate(authReq('u1'));

        expect(result.status).toBe('active');
      });
    });

    // ── multiple accounts / profiles ───────────────────────────────────

    describe('account profiles and switching', () => {
      it('POST /users/me/account-profiles forwards the body', async () => {
        const result = await controller.createAccountProfile(authReq('u1'), {
          label: 'Work',
        } as any);

        expect(accountManagementService.createAccountProfile).toHaveBeenCalledWith('u1', {
          label: 'Work',
        });
        expect(result).toMatchObject({ id: 'profile-1', label: 'Work' });
      });

      it('POST /users/me/account-profiles defaults an empty body', async () => {
        await controller.createAccountProfile(authReq('u1'), undefined as any);

        expect(accountManagementService.createAccountProfile).toHaveBeenCalledWith('u1', {});
      });

      it('PATCH /users/me/account-profiles/:profileId/primary throws when missing', async () => {
        accountManagementService.setPrimaryAccountProfile.mockResolvedValue(null as any);

        await expect(controller.setPrimaryAccountProfile(authReq('u1'), 'nope')).rejects.toThrow(
          'Account profile not found'
        );
      });

      it('POST /users/me/account-switch switches via a profile id', async () => {
        accountManagementService.switchAccountProfile.mockResolvedValue({
          accountId: 'u1',
          profileId: 'profile-1',
          switched: true,
        } as any);

        const result = await controller.switchCurrentAccount(authReq('u1'), {
          profileId: 'profile-1',
        });

        expect(accountManagementService.switchAccountProfile).toHaveBeenCalledWith(
          'u1',
          'profile-1'
        );
        expect(result).toMatchObject({ switched: true });
      });

      it('POST /users/me/account-switch requires an account or profile id', async () => {
        await expect(controller.switchCurrentAccount(authReq('u1'), {})).rejects.toThrow(
          'Account ID or profile ID is required.'
        );
        expect(accountManagementService.switchAccount).not.toHaveBeenCalled();
        expect(accountManagementService.switchAccountProfile).not.toHaveBeenCalled();
      });

      it('POST /users/me/account-switch switches the authenticated account', async () => {
        const result = await controller.switchCurrentAccount(authReq('u1'), { accountId: 'u1' });

        expect(accountManagementService.switchAccount).toHaveBeenCalledWith('u1');
        expect(result).toMatchObject({ switched: true });
      });

      it('POST /users/me/account-switch rejects a foreign account id', async () => {
        await expect(
          controller.switchCurrentAccount(authReq('u1'), { accountId: 'u2' })
        ).rejects.toThrow('Switch accounts by authenticating the target account.');
      });
    });

    // ── moderation: restrict / mute ────────────────────────────────────

    describe('restrict and mute', () => {
      it('POST /users/:id/restrict delegates with the viewer id first', async () => {
        await controller.restrict(authReq('u1'), 'target-id');
        expect(usersService.restrict).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('POST /users/:id/restrict propagates service errors', async () => {
        usersService.restrict.mockRejectedValue(new NotFoundException('Cannot restrict user.'));

        await expect(controller.restrict(authReq('u1'), 'target-id')).rejects.toThrow(
          'Cannot restrict user.'
        );
      });

      it('DELETE /users/:id/restrict unrestricts', async () => {
        await controller.unrestrict(authReq('u1'), 'target-id');
        expect(usersService.unrestrict).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('GET /users/restricted maps users to public responses', async () => {
        usersService.getRestrictedUsers.mockResolvedValue([
          makeMockUser({ id: 'r1', username: 'alice' }),
          makeMockUser({ id: 'r2', username: 'bob' }),
        ] as any);

        const result = await controller.getRestrictedUsers(authReq('u1'));

        expect(usersService.getRestrictedUsers).toHaveBeenCalledWith('u1');
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ id: 'r1', username: 'alice' });
        expect(result[0]).not.toHaveProperty('email');
      });

      it('POST /users/:id/mute delegates', async () => {
        await controller.mute(authReq('u1'), 'target-id');
        expect(usersService.mute).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('DELETE /users/:id/mute unmutes', async () => {
        await controller.unmute(authReq('u1'), 'target-id');
        expect(usersService.unmute).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('GET /users/muted maps muted users', async () => {
        usersService.getMutedUsers.mockResolvedValue([makeMockUser({ id: 'm1' })] as any);

        const result = await controller.getMutedUsers(authReq('u1'));

        expect(usersService.getMutedUsers).toHaveBeenCalledWith('u1');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 'm1' });
      });
    });

    // ── block lists ────────────────────────────────────────────────────

    describe('blocked lists', () => {
      it('GET /users/blocked tolerates a null service result', async () => {
        usersService.getBlockedUsers.mockResolvedValue(null as any);

        const result = await controller.getBlockedUsers(authReq('u1'));

        expect(usersService.getBlockedUsers).toHaveBeenCalledWith('u1');
        expect(result).toEqual([]);
      });

      it('GET /users/blocked/keywords returns the keyword list', async () => {
        usersService.getBlockedKeywords.mockResolvedValue(['spoiler', 'politics']);

        const result = await controller.getBlockedKeywords(authReq('u1'));

        expect(usersService.getBlockedKeywords).toHaveBeenCalledWith('u1');
        expect(result).toEqual(['spoiler', 'politics']);
      });

      it('GET /users/blocked/hashtags returns the hashtag list', async () => {
        usersService.getBlockedHashtags.mockResolvedValue(['gossip']);

        const result = await controller.getBlockedHashtags(authReq('u1'));

        expect(usersService.getBlockedHashtags).toHaveBeenCalledWith('u1');
        expect(result).toEqual(['gossip']);
      });

      it('POST /users/block/content-types/:contentType blocks a type', async () => {
        await controller.blockContentType(authReq('u1'), 'video');

        expect(usersService.blockContentType).toHaveBeenCalledWith('u1', 'video');
      });

      it('DELETE /users/block/content-types/:contentType unblocks a type', async () => {
        await controller.unblockContentType(authReq('u1'), 'video');

        expect(usersService.unblockContentType).toHaveBeenCalledWith('u1', 'video');
      });

      it('GET /users/blocked/content-types returns the type list', async () => {
        usersService.getBlockedContentTypes.mockResolvedValue(['video']);

        const result = await controller.getBlockedContentTypes(authReq('u1'));

        expect(usersService.getBlockedContentTypes).toHaveBeenCalledWith('u1');
        expect(result).toEqual(['video']);
      });
    });

    // ── followers, favorites, hashtags and keywords ────────────────────

    describe('social graph and tagging', () => {
      it('DELETE /users/followers/:id removes a follower (reversed args)', async () => {
        await controller.removeFollower(authReq('u1'), 'follower-id');

        expect(usersService.unfollow).toHaveBeenCalledWith('follower-id', 'u1');
      });

      it('POST /users/:id/favorite adds a favorite', async () => {
        await controller.favorite(authReq('u1'), 'target-id');

        expect(usersService.addFavorite).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('DELETE /users/:id/favorite removes a favorite', async () => {
        await controller.unfavorite(authReq('u1'), 'target-id');

        expect(usersService.removeFavorite).toHaveBeenCalledWith('u1', 'target-id');
      });

      it('POST /users/me/hashtags/follow follows a hashtag', async () => {
        await controller.followHashtag(authReq('u1'), { name: 'travel' });

        expect(usersService.followHashtag).toHaveBeenCalledWith('u1', 'travel');
      });

      it('DELETE /users/me/hashtags/follow/:name decodes the name', async () => {
        await controller.unfollowHashtag(authReq('u1'), 'travel%20life');

        expect(usersService.unfollowHashtag).toHaveBeenCalledWith('u1', 'travel life');
      });

      it('POST /users/me/keywords/block blocks a keyword', async () => {
        await controller.blockKeyword(authReq('u1'), { keyword: 'spoiler' });

        expect(usersService.blockKeyword).toHaveBeenCalledWith('u1', 'spoiler');
      });

      it('DELETE /users/me/keywords/block/:keyword decodes the keyword', async () => {
        await controller.unblockKeyword(authReq('u1'), 'bad%20word');

        expect(usersService.unblockKeyword).toHaveBeenCalledWith('u1', 'bad word');
      });

      it('POST /users/me/hashtags/block blocks a hashtag', async () => {
        await controller.blockHashtag(authReq('u1'), { name: 'gossip' });

        expect(usersService.blockHashtag).toHaveBeenCalledWith('u1', 'gossip');
      });

      it('DELETE /users/me/hashtags/block/:name decodes the name', async () => {
        await controller.unblockHashtag(authReq('u1'), 'breaking%20news');

        expect(usersService.unblockHashtag).toHaveBeenCalledWith('u1', 'breaking news');
      });

      it('GET /users/:id/mutual maps mutual follows', async () => {
        usersService.findMutualFollows.mockResolvedValue([makeMockUser({ id: 'mu1' })] as any);

        const result = await controller.getMutualFollows(authReq('u1'), 'target-id');

        expect(usersService.findMutualFollows).toHaveBeenCalledWith('u1', 'target-id');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 'mu1' });
      });

      it('GET /users/me/followers maps the follower list', async () => {
        usersService.getFollowers.mockResolvedValue([makeMockUser({ id: 'f1' })] as any);

        const result = await controller.getMyFollowers(authReq('u1'));

        expect(usersService.getFollowers).toHaveBeenCalledWith('u1');
        expect(result).toHaveLength(1);
      });
    });

    // ── suggestions, search and discovery ──────────────────────────────

    describe('suggestions, search and discovery', () => {
      it('GET /users/suggestions maps users and pages', async () => {
        usersService.findFollowSuggestions.mockResolvedValue([
          makeMockUser({ id: 's1', username: 'suggested' }),
        ] as any);
        pagesService.findPageSuggestions.mockResolvedValue([{ id: 'page-1' }] as any);

        const result = await controller.getFollowSuggestions(authReq('u1'));

        expect(usersService.findFollowSuggestions).toHaveBeenCalledWith('u1');
        expect(pagesService.findPageSuggestions).toHaveBeenCalledWith('u1');
        expect(result.users).toHaveLength(1);
        expect(result.users[0]).toMatchObject({ id: 's1', username: 'suggested' });
        expect(result.pages).toEqual([{ id: 'page-1' }]);
      });

      it('GET /users/search maps results to search responses', async () => {
        usersService.search.mockResolvedValue([
          makeMockUser({ id: 's1', username: 'found' }),
        ] as any);

        const result = await controller.searchUsers(authReq('u1'), 'found');

        expect(usersService.search).toHaveBeenCalledWith('found', 'u1');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 's1', username: 'found' });
        expect(result[0]).not.toHaveProperty('email');
      });

      it('GET /users/search runs anonymously without a viewer', async () => {
        usersService.search.mockResolvedValue([] as any);

        const result = await controller.searchUsers({}, 'nobody');

        expect(usersService.search).toHaveBeenCalledWith('nobody', undefined);
        expect(result).toEqual([]);
      });

      it('GET /users/search maps zero results', async () => {
        usersService.search.mockResolvedValue([] as any);

        const result = await controller.searchUsers(authReq('u1'), 'missing');

        expect(result).toEqual([]);
      });

      it('POST /users/me/contact-discovery forwards the dto', async () => {
        const dto: any = { contacts: [{ phoneNumber: '+15550001' }] };
        usersService.discoverContacts.mockResolvedValue({ matched: 1 } as any);

        const result = await controller.discoverContacts(authReq('u1'), dto);

        expect(usersService.discoverContacts).toHaveBeenCalledWith('u1', dto);
        expect(result).toEqual({ matched: 1 });
      });
    });

    // ── follow requests ────────────────────────────────────────────────

    describe('follow request decisions', () => {
      it('POST /users/follow-requests/:id/accept accepts', async () => {
        await controller.acceptFollowRequest(authReq('u1'), 'req-1');

        expect(usersService.acceptFollowRequest).toHaveBeenCalledWith('u1', 'req-1');
      });

      it('POST /users/follow-requests/:id/deny denies', async () => {
        await controller.denyFollowRequest(authReq('u1'), 'req-1');

        expect(usersService.denyFollowRequest).toHaveBeenCalledWith('u1', 'req-1');
      });

      it('DELETE /users/follow-requests/user/:targetUserId cancels by user', async () => {
        await controller.cancelFollowRequestByUser(authReq('u1'), 'target-user');

        expect(usersService.cancelFollowRequestByUser).toHaveBeenCalledWith('u1', 'target-user');
      });
    });

    // ── follower lists of another user ─────────────────────────────────

    describe('other users follower lists', () => {
      it('GET /users/:id/followers forwards the viewer id', async () => {
        usersService.getUserFollowers.mockResolvedValue([makeMockUser({ id: 'f1' })] as any);

        const result = await controller.getUserFollowers(authReq('viewer'), 'target-id');

        expect(usersService.getUserFollowers).toHaveBeenCalledWith('target-id', 'viewer');
        expect(result).toHaveLength(1);
      });

      it('GET /users/:id/followers works without a viewer', async () => {
        usersService.getUserFollowers.mockResolvedValue([] as any);

        const result = await controller.getUserFollowers({}, 'target-id');

        expect(usersService.getUserFollowers).toHaveBeenCalledWith('target-id', undefined);
        expect(result).toEqual([]);
      });

      it('GET /users/:id/following forwards the viewer id', async () => {
        usersService.getUserFollowing.mockResolvedValue([makeMockUser({ id: 'g1' })] as any);

        const result = await controller.getUserFollowing(authReq('viewer'), 'target-id');

        expect(usersService.getUserFollowing).toHaveBeenCalledWith('target-id', 'viewer');
        expect(result).toHaveLength(1);
      });

      it('GET /users/:id/following works without a viewer', async () => {
        usersService.getUserFollowing.mockResolvedValue([] as any);

        const result = await controller.getUserFollowing({}, 'target-id');

        expect(usersService.getUserFollowing).toHaveBeenCalledWith('target-id', undefined);
        expect(result).toEqual([]);
      });
    });

    // ── notification settings and life events ──────────────────────────

    describe('notification settings and life events', () => {
      it('PATCH /users/me/notification-settings updates settings', async () => {
        const user = makeMockUser();
        usersService.updateNotificationSettings.mockResolvedValue(user as any);
        const settings: any = { email: false, push: true };

        const result = await controller.updateNotificationSettings(authReq('u1'), settings);

        expect(usersService.updateNotificationSettings).toHaveBeenCalledWith('u1', settings);
        expect(result).toMatchObject({ id: user.id, email: user.email });
      });

      it('GET /users/me/life-events returns the events', async () => {
        usersService.getLifeEvents.mockResolvedValue([{ id: 'ev-1' }] as any);

        const result = await controller.getLifeEvents(authReq('u1'));

        expect(usersService.getLifeEvents).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'ev-1' }]);
      });

      it('POST /users/me/life-events creates an event', async () => {
        const dto: any = { title: 'Moved house', type: 'moved' };
        usersService.addLifeEvent.mockResolvedValue({ id: 'ev-1' } as any);

        await controller.addLifeEvent(authReq('u1'), dto);

        expect(usersService.addLifeEvent).toHaveBeenCalledWith('u1', dto);
      });

      it('PATCH /users/me/life-events/:id updates an event', async () => {
        const dto: any = { title: 'Renamed event' };
        usersService.updateLifeEvent.mockResolvedValue({ id: 'ev-1' } as any);

        await controller.updateLifeEvent('ev-1', dto);

        expect(usersService.updateLifeEvent).toHaveBeenCalledWith('ev-1', dto);
      });

      it('DELETE /users/me/life-events/:id removes an event', async () => {
        await controller.removeLifeEvent('ev-1');

        expect(usersService.removeLifeEvent).toHaveBeenCalledWith('ev-1');
      });
    });

    // ── privacy ────────────────────────────────────────────────────────

    describe('privacy controls', () => {
      it('PATCH /users/me/privacy persists the dto', async () => {
        const user = makeMockUser({ profilePrivacy: 'private' });
        usersService.updatePrivacy.mockResolvedValue(user as any);
        const dto: any = { profilePrivacy: 'private' };

        const result = await controller.updatePrivacy(authReq('u1'), dto);

        expect(usersService.updatePrivacy).toHaveBeenCalledWith('u1', dto);
        expect(result).toBe(user);
      });

      it('GET /users/me/privacy returns the current settings', async () => {
        const privacy: any = { postVisibility: 'public', showOnlineStatus: false };
        usersService.getPrivacy.mockResolvedValue(privacy);

        const result = await controller.getPrivacy(authReq('u1'));

        expect(usersService.getPrivacy).toHaveBeenCalledWith('u1');
        expect(result).toEqual(privacy);
      });

      it('POST /users/me/privacy/personalization/reset resets controls', async () => {
        const controls: any = { personalizationControls: { personalizedAds: false } };
        usersService.resetPersonalizationControls.mockResolvedValue(controls);

        const result = await controller.resetPersonalizationControls(authReq('u1'));

        expect(usersService.resetPersonalizationControls).toHaveBeenCalledWith('u1');
        expect(result).toEqual(controls);
      });
    });

    // ── account management reads ───────────────────────────────────────

    describe('account management reads', () => {
      it('GET /users/me/account-dashboard returns the dashboard', async () => {
        const dashboard: any = { accountId: 'u1', profiles: 1 };
        accountManagementService.getAccountDashboard.mockResolvedValue(dashboard);

        const result = await controller.getAccountDashboard(authReq('u1'));

        expect(accountManagementService.getAccountDashboard).toHaveBeenCalledWith('u1');
        expect(result).toEqual(dashboard);
      });

      it('GET /users/me/security-center returns the security center', async () => {
        const center: any = { securityAlerts: [], pendingApprovals: [] };
        accountManagementService.getSecurityCenter.mockResolvedValue(center);

        const result = await controller.getSecurityCenter(authReq('u1'));

        expect(accountManagementService.getSecurityCenter).toHaveBeenCalledWith('u1');
        expect(result).toEqual(center);
      });

      it('GET /users/me/account-history returns the history', async () => {
        accountManagementService.getAccountHistory.mockResolvedValue([{ id: 'h1' }] as any);

        const result = await controller.getAccountHistory(authReq('u1'));

        expect(accountManagementService.getAccountHistory).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'h1' }]);
      });

      it('GET /users/me/security-log exports the log', async () => {
        const log: any = { exportUrl: '/exports/log.csv', records: [] };
        accountManagementService.exportSecurityLog.mockResolvedValue(log);

        const result = await controller.exportSecurityLog(authReq('u1'));

        expect(accountManagementService.exportSecurityLog).toHaveBeenCalledWith('u1');
        expect(result).toEqual(log);
      });
    });

    // ── linked accounts ────────────────────────────────────────────────

    describe('linked accounts', () => {
      it('POST /users/me/linked-accounts defaults metadata to an empty object', async () => {
        accountManagementService.linkAccount.mockResolvedValue({ provider: 'google' } as any);

        await controller.linkAccount(authReq('u1'), {
          provider: 'google',
          externalUserId: 'g-1',
        });

        expect(accountManagementService.linkAccount).toHaveBeenCalledWith(
          'u1',
          'google',
          'g-1',
          {}
        );
      });

      it('POST /users/me/linked-accounts forwards metadata', async () => {
        accountManagementService.linkAccount.mockResolvedValue({ provider: 'github' } as any);

        await controller.linkAccount(authReq('u1'), {
          provider: 'github',
          externalUserId: 'gh-1',
          metadata: { scope: 'user' },
        });

        expect(accountManagementService.linkAccount).toHaveBeenCalledWith('u1', 'github', 'gh-1', {
          scope: 'user',
        });
      });

      it('DELETE /users/me/linked-accounts/:provider unlinks', async () => {
        accountManagementService.unlinkAccount.mockResolvedValue({ unlinked: true } as any);

        const result = await controller.unlinkAccount(authReq('u1'), 'google');

        expect(accountManagementService.unlinkAccount).toHaveBeenCalledWith('u1', 'google');
        expect(result).toMatchObject({ unlinked: true });
      });
    });

    // ── recovery and appeals ───────────────────────────────────────────

    describe('recovery and appeals', () => {
      it('POST /users/me/account-recovery defaults to email', async () => {
        accountManagementService.startAccountRecovery.mockResolvedValue({
          status: 'pending',
        } as any);

        const result = await controller.startAccountRecovery(authReq('u1'), undefined as any);

        expect(accountManagementService.startAccountRecovery).toHaveBeenCalledWith('u1', 'email');
        expect(result).toMatchObject({ status: 'pending' });
      });

      it('POST /users/me/account-recovery forwards the chosen method', async () => {
        accountManagementService.startAccountRecovery.mockResolvedValue({
          status: 'pending',
        } as any);

        await controller.startAccountRecovery(authReq('u1'), { method: 'passkey' });

        expect(accountManagementService.startAccountRecovery).toHaveBeenCalledWith('u1', 'passkey');
      });

      it('POST /users/me/account-recovery/complete defaults to approved', async () => {
        accountManagementService.completeAccountRecovery.mockResolvedValue({
          status: 'approved',
        } as any);

        const result = await controller.completeAccountRecovery(authReq('u1'), undefined as any);

        expect(accountManagementService.completeAccountRecovery).toHaveBeenCalledWith('u1', true);
        expect(result).toMatchObject({ status: 'approved' });
      });

      it('POST /users/me/account-recovery/complete forwards the decision', async () => {
        accountManagementService.completeAccountRecovery.mockResolvedValue({
          status: 'rejected',
        } as any);

        await controller.completeAccountRecovery(authReq('u1'), { approved: false });

        expect(accountManagementService.completeAccountRecovery).toHaveBeenCalledWith('u1', false);
      });

      it('POST /users/me/verification-appeal defaults links to an empty array', async () => {
        accountManagementService.submitVerificationAppeal.mockResolvedValue({
          id: 'appeal-1',
        } as any);

        await controller.submitVerificationAppeal(authReq('u1'), { reason: 'wrong flag' });

        expect(accountManagementService.submitVerificationAppeal).toHaveBeenCalledWith(
          'u1',
          'wrong flag',
          []
        );
      });

      it('POST /users/me/verification-appeal forwards the links', async () => {
        accountManagementService.submitVerificationAppeal.mockResolvedValue({
          id: 'appeal-2',
        } as any);

        await controller.submitVerificationAppeal(authReq('u1'), {
          reason: 'residency proof',
          links: ['https://example.com/id'],
        });

        expect(accountManagementService.submitVerificationAppeal).toHaveBeenCalledWith(
          'u1',
          'residency proof',
          ['https://example.com/id']
        );
      });
    });

    // ── verification requests ──────────────────────────────────────────

    describe('POST /users/me/verification-request', () => {
      it('routes creator verification requests', async () => {
        accountManagementService.requestCreatorVerification.mockResolvedValue({
          type: 'creator',
        } as any);

        await controller.requestVerification(authReq('u1'), {
          type: 'creator',
          reason: 'I make videos',
          links: ['https://example.com/channel'],
        });

        expect(accountManagementService.requestCreatorVerification).toHaveBeenCalledWith(
          'u1',
          'I make videos',
          ['https://example.com/channel']
        );
        expect(accountManagementService.requestIdentityVerification).not.toHaveBeenCalled();
      });

      it('routes business verification requests', async () => {
        accountManagementService.requestBusinessVerification.mockResolvedValue({
          type: 'business',
        } as any);

        await controller.requestVerification(authReq('u1'), {
          type: 'business',
          reason: 'Registered company',
        });

        expect(accountManagementService.requestBusinessVerification).toHaveBeenCalledWith(
          'u1',
          'Registered company',
          []
        );
      });

      it('routes organization verification requests', async () => {
        accountManagementService.requestOrganizationVerification.mockResolvedValue({
          type: 'organization',
        } as any);

        await controller.requestVerification(authReq('u1'), {
          type: 'organization',
          reason: 'Nonprofit',
          links: [],
        });

        expect(accountManagementService.requestOrganizationVerification).toHaveBeenCalledWith(
          'u1',
          'Nonprofit',
          []
        );
      });

      it('routes explicit identity verification requests', async () => {
        accountManagementService.requestIdentityVerification.mockResolvedValue({
          type: 'identity',
        } as any);

        await controller.requestVerification(authReq('u1'), {
          type: 'identity',
          reason: 'Passport',
        });

        expect(accountManagementService.requestIdentityVerification).toHaveBeenCalledWith(
          'u1',
          'Passport',
          []
        );
      });

      it('falls back to identity verification with default reason and links', async () => {
        accountManagementService.requestIdentityVerification.mockResolvedValue({
          type: 'identity',
        } as any);

        await controller.requestVerification(authReq('u1'), {} as any);

        expect(accountManagementService.requestIdentityVerification).toHaveBeenCalledWith(
          'u1',
          'Verification requested',
          []
        );
        expect(accountManagementService.requestCreatorVerification).not.toHaveBeenCalled();
        expect(accountManagementService.requestBusinessVerification).not.toHaveBeenCalled();
        expect(accountManagementService.requestOrganizationVerification).not.toHaveBeenCalled();
      });
    });

    // ── trust, verification status and security center ─────────────────

    describe('trust and security center', () => {
      it('GET /users/me/verification-status returns the status', async () => {
        const status: any = { status: 'verified' };
        accountManagementService.getVerificationStatus.mockResolvedValue(status);

        const result = await controller.getVerificationStatus(authReq('u1'));

        expect(accountManagementService.getVerificationStatus).toHaveBeenCalledWith('u1');
        expect(result).toEqual(status);
      });

      it('GET /users/me/trust-score normalizes the trust snapshot', async () => {
        accountManagementService.getTrustIndicators.mockResolvedValue({
          accountId: 'u1',
          trustScore: 80,
          verified: true,
          updatedAt: '2026-01-01T00:00:00.000Z',
        } as any);

        const result = await controller.getTrustScore(authReq('u1'));

        expect(result).toEqual({
          accountId: 'u1',
          trustScore: 80,
          verified: true,
          updatedAt: '2026-01-01T00:00:00.000Z',
        });
      });

      it('GET /users/me/trust-score falls back to zero/false', async () => {
        accountManagementService.getTrustIndicators.mockResolvedValue({ accountId: 'u1' } as any);

        const result = await controller.getTrustScore(authReq('u1'));

        expect(result).toMatchObject({ accountId: 'u1', trustScore: 0, verified: false });
      });

      it('GET /users/me/verification-history returns the history', async () => {
        accountManagementService.getVerificationHistory.mockResolvedValue([
          { id: 'appeal-1' },
        ] as any);

        const result = await controller.getVerificationHistory(authReq('u1'));

        expect(accountManagementService.getVerificationHistory).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'appeal-1' }]);
      });

      it('GET /users/me/security-alerts unwraps the security center', async () => {
        accountManagementService.getSecurityCenter.mockResolvedValue({
          securityAlerts: [{ id: 'alert-1' }],
          pendingApprovals: [],
        } as any);

        const result = await controller.getSecurityAlerts(authReq('u1'));

        expect(accountManagementService.getSecurityCenter).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'alert-1' }]);
      });

      it('POST /users/me/security-alerts/:id/resolve defaults to resolved', async () => {
        accountManagementService.resolveSecurityAlert.mockResolvedValue({ id: 'alert-1' } as any);

        const result = await controller.resolveSecurityAlert(authReq('u1'), 'alert-1', {
          resolved: false,
        });

        expect(accountManagementService.resolveSecurityAlert).toHaveBeenCalledWith(
          'u1',
          'alert-1',
          false
        );
        expect(result).toMatchObject({ id: 'alert-1' });
      });

      it('POST /users/me/security-alerts/:id/resolve without a body resolves', async () => {
        accountManagementService.resolveSecurityAlert.mockResolvedValue({ id: 'alert-2' } as any);

        await controller.resolveSecurityAlert(authReq('u1'), 'alert-2', undefined as any);

        expect(accountManagementService.resolveSecurityAlert).toHaveBeenCalledWith(
          'u1',
          'alert-2',
          true
        );
      });

      it('GET /users/me/login-approvals unwraps pending approvals', async () => {
        accountManagementService.getSecurityCenter.mockResolvedValue({
          securityAlerts: [],
          pendingApprovals: [{ id: 'approval-1' }],
        } as any);

        const result = await controller.getLoginApprovals(authReq('u1'));

        expect(accountManagementService.getSecurityCenter).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'approval-1' }]);
      });

      it('POST /users/me/login-approvals/:id/review forwards the decision', async () => {
        accountManagementService.reviewLoginApproval.mockResolvedValue({
          id: 'approval-1',
        } as any);

        await controller.reviewLoginApproval(authReq('u1'), 'approval-1', {
          approved: false,
          note: 'not me',
        });

        expect(accountManagementService.reviewLoginApproval).toHaveBeenCalledWith(
          'u1',
          'approval-1',
          false,
          'not me'
        );
      });

      it('POST /users/me/login-approvals/:id/review defaults to approved', async () => {
        accountManagementService.reviewLoginApproval.mockResolvedValue({
          id: 'approval-2',
        } as any);

        await controller.reviewLoginApproval(authReq('u1'), 'approval-2', undefined as any);

        expect(accountManagementService.reviewLoginApproval).toHaveBeenCalledWith(
          'u1',
          'approval-2',
          true,
          undefined
        );
      });
    });

    // ── pokes ──────────────────────────────────────────────────────────

    describe('extended pokes', () => {
      it('GET /users/me/pokes returns the poke list', async () => {
        usersService.getPokes.mockResolvedValue([{ id: 'poke-1' }] as any);

        const result = await controller.getPokes(authReq('u1'));

        expect(usersService.getPokes).toHaveBeenCalledWith('u1');
        expect(result).toEqual([{ id: 'poke-1' }]);
      });

      it('POST /users/me/pokes/:id/return returns a poke (reversed args)', async () => {
        usersService.returnPoke.mockResolvedValue({ id: 'poke-2' } as any);

        const result = await controller.returnPoke(authReq('u1'), 'poke-1');

        expect(usersService.returnPoke).toHaveBeenCalledWith('poke-1', 'u1');
        expect(result).toEqual({ id: 'poke-2' });
      });

      it('DELETE /users/me/pokes/:id dismisses a poke (reversed args)', async () => {
        await controller.dismissPoke(authReq('u1'), 'poke-1');

        expect(usersService.dismissPoke).toHaveBeenCalledWith('poke-1', 'u1');
      });
    });

    // ── admin verification actions ─────────────────────────────────────

    describe('admin verification actions', () => {
      it('POST /users/me/submit-verification forwards the document', async () => {
        const file: any = { buffer: Buffer.from('id'), mimetype: 'application/pdf' };
        usersService.submitVerification.mockResolvedValue(makeMockUser() as any);

        const result = await controller.submitVerification(authReq('u1'), file);

        expect(usersService.submitVerification).toHaveBeenCalledWith('u1', file);
        expect(result).toMatchObject({ id: makeMockUser().id });
      });

      it('GET /users/verification-requests/pending lists pending users', async () => {
        usersService.getPendingVerifications.mockResolvedValue([makeMockUser()] as any);

        const result = await controller.getPendingVerifications(authReq('u1'));

        expect(usersService.getPendingVerifications).toHaveBeenCalledWith('u1');
        expect(result).toHaveLength(1);
      });

      it('POST /users/:id/verify verifies the target user', async () => {
        usersService.verifyUser.mockResolvedValue(makeMockUser() as any);

        await controller.verifyUser(authReq('u1'), 'target-id');

        expect(usersService.verifyUser).toHaveBeenCalledWith('target-id', 'u1');
      });

      it('POST /users/:id/unverify unverifies the target user', async () => {
        usersService.unverifyUser.mockResolvedValue(makeMockUser() as any);

        await controller.unverifyUser(authReq('u1'), 'target-id');

        expect(usersService.unverifyUser).toHaveBeenCalledWith('target-id', 'u1');
      });

      it('POST /users/:id/reject-verification rejects the target user', async () => {
        usersService.rejectVerification.mockResolvedValue(makeMockUser() as any);

        await controller.rejectVerification(authReq('u1'), 'target-id');

        expect(usersService.rejectVerification).toHaveBeenCalledWith('target-id', 'u1');
      });
    });

    // ── visibility filtering ───────────────────────────────────────────

    describe('activity visibility filtering', () => {
      it('leaves profiles untouched when the viewer may see activity', async () => {
        const user = { ...makeMockUser(), isOnline: true, lastSeenAt: '2026-01-01' };
        usersService.findByUsername.mockResolvedValue(user as any);
        const mapper = jest.spyOn(usersMappers, 'toPublicUserResponse');

        try {
          const result = await controller.findByUsername(authReq('viewer'), 'testuser');

          expect(visibilityService.canViewActivity).toHaveBeenCalledWith('viewer', user);
          expect(mapper).toHaveBeenCalledTimes(1);
          expect(mapper.mock.calls[0][0]).toBe(user);
          expect(result).toHaveProperty('id', user.id);
        } finally {
          mapper.mockRestore();
        }
      });

      it('strips activity fields when the viewer may not see activity', async () => {
        visibilityService.canViewActivity.mockResolvedValue(false);
        const user = { ...makeMockUser(), isOnline: true, lastSeenAt: '2026-01-01' };
        usersService.findByUsername.mockResolvedValue(user as any);
        const mapper = jest.spyOn(usersMappers, 'toPublicUserResponse');

        try {
          const result = await controller.findByUsername(authReq('viewer'), 'testuser');

          expect(visibilityService.canViewActivity).toHaveBeenCalledWith('viewer', user);
          expect(mapper).toHaveBeenCalledTimes(1);
          const visible = mapper.mock.calls[0][0];
          expect(visible).not.toBe(user);
          expect(visible).not.toHaveProperty('isOnline');
          expect(visible).not.toHaveProperty('lastSeenAt');
          expect(visible).toHaveProperty('id', user.id);
          expect(result).toHaveProperty('id', user.id);
        } finally {
          mapper.mockRestore();
        }
      });

      it('returns null profiles untouched for unknown usernames', async () => {
        usersService.findByUsername.mockResolvedValue(null as any);

        const result = await controller.findByUsername({}, 'ghost');

        expect(result).toBeNull();
        expect(visibilityService.canViewActivity).not.toHaveBeenCalled();
      });

      it('treats an anonymous viewer as null in GET /users/:id', async () => {
        visibilityService.canViewActivity.mockResolvedValue(false);
        const user = { ...makeMockUser(), isOnline: true, lastSeenAt: '2026-01-01' };
        usersService.findOneWithPosts.mockResolvedValue(user as any);
        const mapper = jest.spyOn(usersMappers, 'toPublicUserResponse');

        try {
          const result = await controller.getPublicProfile({}, 'target-id');

          expect(usersService.findOneWithPosts).toHaveBeenCalledWith('target-id', undefined, 10, 0);
          expect(visibilityService.canViewActivity).toHaveBeenCalledWith(null, user);
          expect(mapper.mock.calls[0][0]).not.toHaveProperty('isOnline');
          expect(mapper.mock.calls[0][0]).not.toHaveProperty('lastSeenAt');
          expect(result).toHaveProperty('id', user.id);
        } finally {
          mapper.mockRestore();
        }
      });
    });

    // ── anonymous request handling ─────────────────────────────────────

    describe('optional auth handlers', () => {
      it('GET /users/:username works for anonymous viewers', async () => {
        const user = makeMockUser();
        usersService.findByUsername.mockResolvedValue(user as any);

        const result = await controller.findByUsername({}, 'testuser');

        expect(usersService.findByUsername).toHaveBeenCalledWith('testuser', [], undefined);
        expect(result).toMatchObject({ id: user.id });
      });
    });
  });
});
