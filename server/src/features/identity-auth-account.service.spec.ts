import { AccountManagementService } from './account-management/account-management.service';
import { DataManagementService } from './data-management/data-management.service';

describe('AccountManagementService', () => {
  it('persists account permissions and preserves an intentionally empty set', async () => {
    const userRepository = {
      findOne: jest.fn()
        .mockResolvedValueOnce({ id: 'user-42', accountPermissions: null })
        .mockResolvedValueOnce({ id: 'user-42', accountPermissions: [] }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new AccountManagementService(undefined, userRepository as any);

    const defaults = await service.getPermissions('user-42');
    expect(defaults.permissions).toEqual(['profile:read', 'profile:write', 'posts:read', 'posts:write']);

    const updated = await service.updatePermissions('user-42', ['posts:write', 'posts:write']);
    expect(updated.permissions).toEqual(['posts:write']);
    expect(userRepository.update).toHaveBeenCalledWith('user-42', { accountPermissions: ['posts:write'] });

    const empty = await service.updatePermissions('user-42', []);
    expect(empty.permissions).toEqual([]);
    expect(userRepository.update).toHaveBeenLastCalledWith('user-42', { accountPermissions: [] });
  });

  it('persists and reloads data permissions independently from account capabilities', async () => {
    const userRepository = {
      findOne: jest.fn()
        .mockResolvedValueOnce({ id: 'user-44', accountDataPermissions: null })
        .mockResolvedValueOnce({ id: 'user-44', accountDataPermissions: ['profile', 'analytics'] }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new AccountManagementService(undefined, userRepository as any);

    const defaults = await service.getDataPermissions('user-44');
    expect(defaults.dataPermissions).toEqual(['profile', 'posts', 'settings']);

    const updated = await service.updateDataPermissions('user-44', ['profile', 'analytics', 'profile']);
    expect(updated.dataPermissions).toEqual(['profile', 'analytics']);
    expect(userRepository.update).toHaveBeenCalledWith('user-44', {
      accountDataPermissions: ['profile', 'analytics'],
    });

    const reloaded = await service.getDataPermissions('user-44');
    expect(reloaded.dataPermissions).toEqual(['profile', 'analytics']);

    await expect(service.updateDataPermissions('user-44', ['unknown'])).rejects.toThrow('Invalid data permission category');
  });

  it('persists account security controls and reloads them from the user record', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-43',
        accountSecuritySettings: {
          twoFactorAuthentication: true,
          passkeysEnabled: true,
          updatedAt: '2026-09-05T00:00:00.000Z',
        },
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new AccountManagementService(undefined, userRepository as any);

    const loaded = await service.getAccountSecuritySettings('user-43');
    expect(loaded.twoFactorAuthentication).toBe(true);
    expect(loaded.passkeysEnabled).toBe(true);
    expect(loaded.loginApprovalsEnabled).toBe(true);

    await service.updateAccountSecuritySettings('user-43', { recoveryCodesEnabled: true });
    expect(userRepository.update).toHaveBeenCalledWith('user-43', {
      accountSecuritySettings: expect.objectContaining({
        twoFactorAuthentication: true,
        passkeysEnabled: true,
        recoveryCodesEnabled: true,
      }),
    });
  });

  it('loads the account dashboard from persisted user and linked-account records', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-42',
        status: 'active',
        profileTheme: 'dark',
        showOnlineStatus: false,
        readReceipts: false,
        mentions: 'followers',
        activityVisibility: 'friends',
        contactDiscovery: false,
        personalization: false,
        adPersonalization: false,
        notificationSettings: {
          emailNotifications: true,
          likes: true,
          comments: false,
          newFollowers: true,
          messages: true,
        },
      }),
    };

    const linkedAccountRepository = {
      find: jest.fn().mockResolvedValue([
        {
          provider: 'google',
          displayName: 'Jane Doe',
          email: 'jane@example.com',
          isPrimary: true,
          connectedAt: new Date(),
        },
      ]),
    };

    const securityAlertRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'alert-1',
          userId: 'user-42',
          type: 'suspicious_login',
          message: 'Unexpected login from a new device',
          severity: 'high',
          resolved: false,
          metadata: { ipAddress: '203.0.113.9' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    const service = new AccountManagementService(
      undefined,
      userRepository as any,
      linkedAccountRepository as any,
      securityAlertRepository as any,
      undefined,
    );

    const dashboard = await service.getAccountDashboard('user-42');

    expect(dashboard.account.accountId).toBe('user-42');
    expect(dashboard.preferences.theme).toBe('dark');
    expect(dashboard.privacy.showOnlineStatus).toBe(false);
    expect(dashboard.linkedAccounts[0].provider).toBe('google');
    expect(dashboard.securityCenter.securityAlerts[0].message).toContain('Unexpected login');
  });

  it('deactivates the account and returns a real status payload', async () => {
    const usersService = {
      deactivate: jest.fn().mockResolvedValue({ id: 'user-1', status: 'deactivated' }),
      reactivate: jest.fn(),
    };

    const service = new AccountManagementService(usersService as any);
    const result = await service.deactivateAccount('user-1', 'Changed jobs');

    expect(usersService.deactivate).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({
      userId: 'user-1',
      status: 'deactivated',
      reason: 'Changed jobs',
      message: 'Account deactivated successfully.',
    });
  });

  it('reactivates the account and returns a real status payload', async () => {
    const usersService = {
      deactivate: jest.fn(),
      reactivate: jest.fn().mockResolvedValue({ id: 'user-1', status: 'active' }),
    };

    const service = new AccountManagementService(usersService as any);
    const result = await service.reactivateAccount('user-1');

    expect(usersService.reactivate).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({
      userId: 'user-1',
      status: 'active',
      message: 'Account reactivated successfully.',
    });
  });

  it('stores account preferences, notification preferences, and exposes them in the dashboard', async () => {
    const service = new AccountManagementService();

    const preferences = await service.updateAccountPreferences('user-1', {
      theme: 'dark',
      language: 'en-US',
      timezone: 'UTC',
      defaultPrivacy: 'friends',
    });

    expect(preferences.theme).toBe('dark');
    expect(preferences.defaultPrivacy).toBe('friends');

    const notifications = await service.updateNotificationPreferences('user-1', {
      emailDigest: false,
      pushAlerts: true,
      smsAlerts: false,
    });

    expect(notifications.emailDigest).toBe(false);
    expect(notifications.pushAlerts).toBe(true);

    const dashboard = await service.getAccountDashboard('user-1');
    expect(dashboard.preferences.theme).toBe('dark');
    expect(dashboard.notifications.emailDigest).toBe(false);
  });

  it('persists account notification preferences on the user record', async () => {
    const user = {
      id: 'user-2',
      notificationSettings: {
        emailNotifications: true,
        likes: true,
        comments: true,
        newFollowers: true,
        messages: true,
      },
    };
    const usersService = {
      findOneById: jest.fn().mockResolvedValue(user),
      updateNotificationSettings: jest.fn().mockImplementation(async (_userId, settings) => {
        user.notificationSettings = settings;
        return user;
      }),
    };
    const service = new AccountManagementService(usersService as any);

    const saved = await service.updateNotificationPreferences('user-2', {
      emailDigest: false,
      pushAlerts: false,
      notifyMentions: false,
    });

    expect(usersService.updateNotificationSettings).toHaveBeenCalledWith('user-2', expect.objectContaining({
      emailNotifications: false,
      emailDigest: false,
      pushAlerts: false,
      notifyMentions: false,
    }));
    expect(saved).toMatchObject({
      emailDigest: false,
      pushAlerts: false,
      notifyMentions: false,
    });
  });

  it('tracks trusted devices and exposes them in the security center', async () => {
    const service = new AccountManagementService();

    const device = await service.registerTrustedDevice('user-1', 'Surface Laptop', 'device-123', { platform: 'windows' });
    expect(device.deviceName).toBe('Surface Laptop');

    const center = await service.getSecurityCenter('user-1');
    expect(center.trustedDevices).toEqual(expect.arrayContaining([
      expect.objectContaining({ deviceName: 'Surface Laptop' })
    ]));
  });

  it('links accounts, captures account history, and exposes recovery status', async () => {
    const service = new AccountManagementService();

    const linked = await service.linkAccount('user-1', 'google', 'ext-123', { displayName: 'Jane Doe' });
    expect(linked.provider).toBe('google');
    expect(service.getLinkedAccounts('user-1')).toHaveLength(1);

    const recovery = await service.startAccountRecovery('user-1', 'email');
    expect(recovery.status).toBe('pending');
    const history = await service.getAccountHistory('user-1');
    expect(history.length).toBeGreaterThan(0);
  });

  it('supports verification appeals, privacy controls, and security exports', async () => {
    const service = new AccountManagementService();

    const appeal = await service.submitVerificationAppeal('user-1', 'Business ID mismatch', ['https://example.com/docs']);
    expect(appeal.status).toBe('pending');

    const privacy = await service.updatePrivacySettings('user-1', {
      showOnlineStatus: false,
      readReceipts: false,
      mentions: 'followers',
      activityVisibility: 'friends',
      contactDiscovery: false,
      personalization: false,
      adPersonalization: false,
    });
    expect(privacy.showOnlineStatus).toBe(false);
    expect(privacy.activityVisibility).toBe('friends');

    const center = await service.getSecurityCenter('user-1');
    expect(center.logs.length).toBeGreaterThan(0);
    expect(center.exportUrl).toContain('security-log');
  });

  it('creates suspicious login alerts and supports login approval review', async () => {
    const service = new AccountManagementService();

    const alert = await service.recordSecurityAlert('user-1', 'suspicious_login', 'New sign-in from an unrecognized device', 'high', {
      ipAddress: '198.51.100.10',
      userAgent: 'Chrome Mobile',
    });
    expect(alert.type).toBe('suspicious_login');
    expect(alert.severity).toBe('high');

    const approval = await service.createLoginApproval('user-1', {
      deviceName: 'Unknown device',
      ipAddress: '198.51.100.10',
      userAgent: 'Chrome Mobile',
      location: 'Berlin, DE',
    });
    expect(approval.status).toBe('pending');

    const approved = await service.reviewLoginApproval('user-1', approval.id, true, 'Verified by user');
    expect(approved.status).toBe('approved');

    const center = await service.getSecurityCenter('user-1');
    expect(center.securityAlerts.some((entry) => entry.type === 'suspicious_login')).toBe(true);
    expect(center.pendingApprovals.length).toBe(0);
  });

  it('supports multi-account profiles, export payloads, and verification requests', async () => {
    const service = new AccountManagementService();

    const primary = await service.createAccountProfile('user-1', { label: 'Primary', accountType: 'personal' });
    const work = await service.createAccountProfile('user-2', { label: 'Work', accountType: 'business' });

    expect(primary.label).toBe('Primary');
    expect(work.accountType).toBe('business');
    expect(await service.listAccountProfiles('user-1')).toEqual(expect.arrayContaining([
      expect.objectContaining({ accountId: 'user-1', label: 'Primary', isPrimary: true }),
    ]));

    const exportPayload = await service.exportAccountData('user-1', {
      includeSecurityLog: true,
      includeLinkedAccounts: true,
      includePrivacySettings: true,
    });
    expect(exportPayload.status).toBe('ready');
    expect(exportPayload.fileUrl).toContain('account');

    const verification = await service.requestIdentityVerification('user-1', 'Uploaded passport scan and selfie', ['https://example.com/verification/passport']);
    expect(verification.status).toBe('pending');
    expect(verification.reason).toContain('passport');
  });

  it('switches between account profiles without leaving the active profile in an invalid state', async () => {
    const service = new AccountManagementService();

    const personal = await service.createAccountProfile('user-1', { label: 'Personal', accountType: 'personal' });
    const creator = await service.createAccountProfile('user-1', { label: 'Creator', accountType: 'creator' });

    const switched = await service.switchAccountProfile('user-1', creator.id);
    expect(switched).toMatchObject({
      accountId: 'user-1',
      profileId: creator.id,
      switched: true,
      message: 'Account profile switched successfully.',
    });
    const profiles = await service.listAccountProfiles('user-1');
    expect(profiles.find((profile) => profile.id === creator.id)).toEqual(expect.objectContaining({
      isCurrent: true,
      isPrimary: false,
    }));
    expect(profiles.find((profile) => profile.id === personal.id)).toEqual(expect.objectContaining({
      isCurrent: false,
      isPrimary: true,
    }));
  });

  it('persists the selected account profile independently of the primary profile', async () => {
    const userRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new AccountManagementService(undefined, userRepository as any);

    const personal = await service.createAccountProfile('user-2', { label: 'Personal' });
    const creator = await service.createAccountProfile('user-2', { label: 'Creator', accountType: 'creator' });
    await service.switchAccountProfile('user-2', creator.id);

    expect(userRepository.update).toHaveBeenLastCalledWith('user-2', { activeAccountProfileId: creator.id });
    expect(await service.getActiveAccountProfile('user-2')).toEqual(expect.objectContaining({ id: creator.id }));
    expect((await service.listAccountProfiles('user-2')).find((profile) => profile.id === personal.id)?.isPrimary).toBe(true);
  });

  it('tracks account sessions and supports data-download and deletion requests', async () => {
    const service = new AccountManagementService();

    const session = await service.createAccountSession('user-9', 'Desktop Browser', '203.0.113.9');
    expect(session.deviceName).toBe('Desktop Browser');

    const sessions = await service.listAccountSessions('user-9');
    expect(sessions.length).toBeGreaterThan(0);

    const download = await service.requestDataDownload('user-9', ['posts', 'messages', 'profile']);
    expect(download.status).toBe('ready');
    expect(download.fileUrl).toContain('download');

    const deletion = await service.requestDataDeletion('user-9', ['posts', 'messages'], 'Privacy cleanup');
    expect(deletion.status).toBe('queued');
    expect(deletion.reason).toBe('Privacy cleanup');
  });

  it('revokes JWT-backed login sessions through account session controls', async () => {
    const loginSession = {
      id: 'jwt-session-1',
      user: { id: 'user-10' },
      deviceName: 'Browser',
      ipAddress: '203.0.113.10',
      userAgent: 'Test Browser',
      revokedAt: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };
    const loginSessionsRepository = {
      findOne: jest.fn().mockResolvedValue(loginSession),
      save: jest.fn().mockImplementation(async (session) => session),
      find: jest.fn().mockResolvedValue([loginSession]),
    };
    const service = new AccountManagementService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      loginSessionsRepository as any,
      undefined,
    );

    const result = await service.revokeAccountSession('user-10', 'jwt-session-1');

    expect(result.revoked).toBe(true);
    expect(loginSession.revokedAt).toBeInstanceOf(Date);
    expect(loginSessionsRepository.save).toHaveBeenCalledWith(loginSession);
  });

  it('supports the full account security feature matrix and summary states', async () => {
    const service = new AccountManagementService();

    const settings = await service.updateAccountSecuritySettings('user-10', {
      twoFactorAuthentication: true,
      biometricAuthentication: true,
      passkeysEnabled: true,
      recoveryCodesEnabled: true,
      loginApprovalsEnabled: true,
      suspiciousLoginAlertsEnabled: true,
      deviceManagementEnabled: true,
      sessionManagementEnabled: true,
      accountRecoveryEnabled: true,
      securityCenterEnabled: true,
    });

    expect(settings.twoFactorAuthentication).toBe(true);
    expect(settings.passkeysEnabled).toBe(true);
    expect(settings.recoveryCodesEnabled).toBe(true);

    const summary = await service.getAccountSecuritySummary('user-10');
    expect(summary.features.passkeysEnabled).toBe(true);
    expect(summary.features.loginApprovalsEnabled).toBe(true);
    expect(summary.features.securityCenterEnabled).toBe(true);
    expect(summary.riskLevel).toBe('low');
  });

  it('tracks account deletion requests and confirms permanent deletion when the user approves', async () => {
    const usersService = {
      deactivate: jest.fn().mockResolvedValue({ id: 'user-15', status: 'deactivated' }),
      reactivate: jest.fn(),
      delete: jest.fn().mockResolvedValue({ id: 'user-15', status: 'deleted' }),
    };

    const service = new AccountManagementService(usersService as any);

    const requested = await service.requestAccountDeletion('user-15', {
      reason: 'privacy_concerns',
      deleteAllData: true,
      deleteLinkedAccounts: true,
      additionalInfo: 'Please erase all personal data',
    });

    expect(requested.status).toBe('pending');
    expect(requested.message).toContain('pending');

    const confirmed = await service.confirmAccountDeletion('user-15', 'DELETE');
    expect(confirmed.status).toBe('deleted');
    expect(confirmed.message).toContain('deleted');
    expect(usersService.delete).toHaveBeenCalledWith('user-15');
  });

  it('applies privacy defaults and preserves user-controlled security toggles with consistent summary data', async () => {
    const service = new AccountManagementService();

    await service.updatePrivacySettings('user-14', {
      showOnlineStatus: false,
      readReceipts: false,
      mentions: 'followers',
      activityVisibility: 'private',
      storyVisibility: 'only_me',
      searchVisibility: 'no_one',
      contactDiscovery: false,
      personalization: false,
      adPersonalization: false,
    });

    const summary = await service.getPrivacySummary('user-14');
    expect(summary.protectionLevel).toBe('strong');
    expect(summary.blockedDefaults).toEqual(expect.arrayContaining(['contact discovery', 'ad personalization']));

    const updated = await service.updateAccountSecuritySettings('user-14', {
      twoFactorAuthentication: true,
      passkeysEnabled: true,
      recoveryCodesEnabled: true,
      securityCenterEnabled: true,
    });

    expect(updated.twoFactorAuthentication).toBe(true);
    expect(updated.passkeysEnabled).toBe(true);
    expect(updated.securityCenterEnabled).toBe(true);
  });

  it('builds a verification summary with trust score, badges, and review status', async () => {
    const service = new AccountManagementService();

    await service.requestCreatorVerification('user-11', 'Brand partnership proof', ['https://example.com/brand']);
    await service.updateTrustIndicators('user-11', { verified: true, badges: ['creator'], trustScore: 88 });

    const summary = await service.getVerificationSummary('user-11');
    expect(summary.status).toBe('pending');
    expect(summary.verified).toBe(false);
    expect(summary.badges).toContain('creator');
    expect(summary.trustScore).toBeGreaterThanOrEqual(80);
  });

  it('computes a real trust snapshot from verification and security signals', async () => {
    const service = new AccountManagementService();

    await service.submitVerificationAppeal('user-22', 'Identity verification evidence', ['https://example.com/id']);
    await service.updateIdentitySettings('user-22', {
      displayName: 'Jane Verified',
      bio: 'Verified creator with a complete profile',
      publicProfile: true,
      creatorMode: true,
      businessMode: false,
      ageVerified: true,
      enhancedSecurity: true,
      verificationRequired: true,
    });
    await service.updateAccountSecuritySettings('user-22', {
      twoFactorAuthentication: true,
      passkeysEnabled: true,
      recoveryCodesEnabled: true,
      loginApprovalsEnabled: true,
      suspiciousLoginAlertsEnabled: true,
      deviceManagementEnabled: true,
      sessionManagementEnabled: true,
      accountRecoveryEnabled: true,
      securityCenterEnabled: true,
    });
    await service.linkAccount('user-22', 'google', 'ext-google-jane', { displayName: 'Jane Doe' });

    const trust = await service.getTrustIndicators('user-22');

    expect(trust.trustScore).toBeGreaterThanOrEqual(80);
    expect(trust.verified).toBe(true);
    expect(trust.badges).toEqual(expect.arrayContaining([
      'identity_verified',
      'profile_complete',
      'two_factor_enabled',
      'passkey_ready',
    ]));
  });

  it('summarizes privacy controls and returns a usable protection profile', async () => {
    const service = new AccountManagementService();

    await service.updatePrivacySettings('user-12', {
      showOnlineStatus: false,
      readReceipts: false,
      mentions: 'followers',
      activityVisibility: 'friends',
      storyVisibility: 'followers',
      searchVisibility: 'friends',
      contactDiscovery: false,
      personalization: false,
      adPersonalization: false,
    });

    const summary = await service.getPrivacySummary('user-12');
    expect(summary.storyVisibility).toBe('followers');
    expect(summary.protectionLevel).toMatch(/strong|balanced|limited/);
    expect(summary.blockedDefaults).toEqual(expect.arrayContaining(['contact discovery', 'ad personalization']));
  });
});

describe('DataManagementService', () => {
  it('creates a user data export payload with a valid url and status', async () => {
    const dataExportService = {
      create: jest.fn().mockResolvedValue({ id: 'exp-1', status: 'completed', fileUrl: '/uploads/exp-1.zip' }),
    };

    const service = new DataManagementService({ dataExportService } as any);
    const result = await service.downloadUserData('user-1');

    expect(dataExportService.create).toHaveBeenCalledWith({ id: 'user-1' });
    expect(result).toMatchObject({
      userId: 'user-1',
      status: 'completed',
      fileUrl: '/uploads/exp-1.zip',
    });
  });

  it('deletes the user account and returns a real confirmation payload', async () => {
    const usersService = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const service = new DataManagementService({ usersService } as any);
    const result = await service.deleteAccount('user-1');

    expect(usersService.delete).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({
      userId: 'user-1',
      status: 'deleted',
      message: 'Account deleted successfully.',
    });
  });
});
