import { AccountManagementService } from './account-management/account-management.service';
import { DataManagementService } from './data-management/data-management.service';

describe('AccountManagementService', () => {
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
    expect(service.listAccountProfiles('user-1')).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'user-1', label: 'Primary' }),
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
