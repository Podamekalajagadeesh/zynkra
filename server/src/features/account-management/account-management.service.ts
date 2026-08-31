export interface AccountSettings {
  accountId: string;
  deactivated: boolean;
  switchingEnabled: boolean;
  permissions: string[];
  personalizationSettings: Record<string, any>;
  dataPermissions: string[];
  updatedAt: string;
}

export interface AccountSecurityFeatureSettings {
  accountId: string;
  twoFactorAuthentication: boolean;
  biometricAuthentication: boolean;
  passkeysEnabled: boolean;
  recoveryCodesEnabled: boolean;
  loginApprovalsEnabled: boolean;
  suspiciousLoginAlertsEnabled: boolean;
  deviceManagementEnabled: boolean;
  sessionManagementEnabled: boolean;
  accountRecoveryEnabled: boolean;
  securityCenterEnabled: boolean;
  updatedAt: string;
}

export interface AccountPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  defaultPrivacy: 'public' | 'friends' | 'private';
  updatedAt: string;
}

export interface NotificationPreferences {
  emailDigest: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  securityAlerts: boolean;
  updatedAt: string;
}

export interface TrustedDevice {
  id: string;
  accountId: string;
  deviceName: string;
  deviceId: string;
  platform?: string;
  metadata?: Record<string, any>;
  lastSeenAt: string;
  createdAt: string;
}

export interface LinkedAccount {
  id: string;
  provider: string;
  externalUserId: string;
  displayName?: string;
  email?: string;
  connectedAt: string;
  isPrimary: boolean;
}

export interface AccountHistoryEntry {
  id: string;
  type: 'sign_in' | 'security' | 'verification' | 'recovery' | 'settings';
  summary: string;
  occurredAt: string;
  metadata?: Record<string, any>;
}

export interface VerificationAppeal {
  id: string;
  accountId: string;
  reason: string;
  links: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}

export interface SecurityAlert {
  id: string;
  accountId: string;
  type: 'suspicious_login' | 'new_device' | 'password_reset' | 'verification' | 'account_recovery' | 'security_setting';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface LoginApprovalRequest {
  id: string;
  accountId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

export interface PrivacySettingsSnapshot {
  showOnlineStatus: boolean;
  readReceipts: boolean;
  mentions: 'everyone' | 'followers' | 'no_one';
  activityVisibility: 'public' | 'friends' | 'private';
  storyVisibility: 'public' | 'friends' | 'followers' | 'only_me';
  searchVisibility: 'everyone' | 'friends' | 'no_one';
  contactDiscovery: boolean;
  personalization: boolean;
  adPersonalization: boolean;
  updatedAt: string;
}

export interface AccountProfile {
  id: string;
  accountId: string;
  label: string;
  accountType: 'personal' | 'creator' | 'business' | 'organization';
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdentitySettings {
  accountId: string;
  displayName: string;
  bio: string;
  publicProfile: boolean;
  creatorMode: boolean;
  businessMode: boolean;
  ageVerified: boolean;
  enhancedSecurity: boolean;
  verificationRequired: boolean;
  updatedAt: string;
}

export interface AccountSession {
  id: string;
  accountId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  isCurrent: boolean;
  createdAt: string;
  lastSeenAt: string;
  status: 'active' | 'revoked';
}

export class AccountManagementService {
  private readonly accountSettings = new Map<string, AccountSettings>();
  private readonly accountPreferences = new Map<string, AccountPreferences>();
  private readonly notificationPreferences = new Map<string, NotificationPreferences>();
  private readonly accountSecuritySettings = new Map<string, AccountSecurityFeatureSettings>();
  private readonly linkedAccounts = new Map<string, LinkedAccount[]>();
  private readonly accountHistory = new Map<string, AccountHistoryEntry[]>();
  private readonly recoveryQueue = new Map<string, { status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string; }>();
  private readonly verificationAppeals = new Map<string, VerificationAppeal[]>();
  private readonly privacySettings = new Map<string, PrivacySettingsSnapshot>();
  private readonly trustedDevices = new Map<string, TrustedDevice[]>();
  private readonly securityAlerts = new Map<string, SecurityAlert[]>();
  private readonly loginApprovals = new Map<string, LoginApprovalRequest[]>();
  private readonly accountProfiles = new Map<string, AccountProfile[]>();
  private readonly identitySettingsMap = new Map<string, IdentitySettings>();
  private readonly trustIndicatorsMap = new Map<string, { verified: boolean; badges: string[]; trustScore: number; updatedAt: string; }>();
  private readonly accountSessions = new Map<string, AccountSession[]>();
  private readonly dataDownloadRequests = new Map<string, { id: string; accountId: string; dataTypes: string[]; status: 'ready' | 'processing' | 'failed'; fileUrl: string; createdAt: string; }[]>();
  private readonly dataDeletionRequests = new Map<string, { id: string; accountId: string; dataTypes: string[]; reason: string; status: 'queued' | 'processing' | 'completed'; createdAt: string; }[]>();
  private readonly accountDeletionRequests = new Map<string, {
    id: string;
    accountId: string;
    reason: string;
    additionalInfo?: string;
    deleteLinkedAccounts: boolean;
    deleteAllData: boolean;
    status: 'pending' | 'deleted';
    createdAt: string;
    processedAt?: string;
  }>();

  constructor(
    private readonly usersService?: {
      deactivate?: (userId: string) => Promise<any>;
      reactivate?: (userId: string) => Promise<any>;
      delete?: (userId: string) => Promise<any>;
    },
  ) {}

  private ensureSettings(accountId: string): AccountSettings {
    const existing = this.accountSettings.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: AccountSettings = {
      accountId,
      deactivated: false,
      switchingEnabled: true,
      permissions: ['profile:read', 'profile:write', 'posts:read', 'posts:write'],
      personalizationSettings: {
        theme: 'default',
        compactMode: false,
      },
      dataPermissions: ['profile', 'posts', 'settings'],
      updatedAt: new Date().toISOString(),
    };

    this.accountSettings.set(accountId, initial);
    return initial;
  }

  private ensureHistory(accountId: string): AccountHistoryEntry[] {
    if (!this.accountHistory.has(accountId)) {
      this.accountHistory.set(accountId, []);
    }
    return this.accountHistory.get(accountId)!;
  }

  private ensurePrivacy(accountId: string): PrivacySettingsSnapshot {
    const existing = this.privacySettings.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: PrivacySettingsSnapshot = {
      showOnlineStatus: true,
      readReceipts: true,
      mentions: 'everyone',
      activityVisibility: 'friends',
      storyVisibility: 'friends',
      searchVisibility: 'everyone',
      contactDiscovery: true,
      personalization: true,
      adPersonalization: true,
      updatedAt: new Date().toISOString(),
    };

    this.privacySettings.set(accountId, initial);
    return initial;
  }

  private ensureAccountPreferences(accountId: string): AccountPreferences {
    const existing = this.accountPreferences.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: AccountPreferences = {
      theme: 'system',
      language: 'en-US',
      timezone: 'UTC',
      defaultPrivacy: 'friends',
      updatedAt: new Date().toISOString(),
    };

    this.accountPreferences.set(accountId, initial);
    return initial;
  }

  private ensureNotificationPreferences(accountId: string): NotificationPreferences {
    const existing = this.notificationPreferences.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: NotificationPreferences = {
      emailDigest: true,
      pushAlerts: true,
      smsAlerts: false,
      securityAlerts: true,
      updatedAt: new Date().toISOString(),
    };

    this.notificationPreferences.set(accountId, initial);
    return initial;
  }

  private ensureAccountSecuritySettings(accountId: string): AccountSecurityFeatureSettings {
    const existing = this.accountSecuritySettings.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: AccountSecurityFeatureSettings = {
      accountId,
      twoFactorAuthentication: false,
      biometricAuthentication: false,
      passkeysEnabled: false,
      recoveryCodesEnabled: false,
      loginApprovalsEnabled: true,
      suspiciousLoginAlertsEnabled: true,
      deviceManagementEnabled: true,
      sessionManagementEnabled: true,
      accountRecoveryEnabled: true,
      securityCenterEnabled: true,
      updatedAt: new Date().toISOString(),
    };

    this.accountSecuritySettings.set(accountId, initial);
    return initial;
  }

  private ensureTrustedDevices(accountId: string): TrustedDevice[] {
    if (!this.trustedDevices.has(accountId)) {
      this.trustedDevices.set(accountId, []);
    }
    return this.trustedDevices.get(accountId)!;
  }

  private recordHistory(accountId: string, type: AccountHistoryEntry['type'], summary: string, metadata?: Record<string, any>) {
    const history = this.ensureHistory(accountId);
    history.unshift({
      id: `history-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type,
      summary,
      occurredAt: new Date().toISOString(),
      metadata,
    });
  }

  async switchAccount(accountId: string): Promise<{ accountId: string; switched: boolean; message: string; settings: AccountSettings }> {
    const settings = this.ensureSettings(accountId);
    settings.switchingEnabled = true;
    settings.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'settings', 'Switched active account context', { accountId });

    return {
      accountId,
      switched: true,
      message: 'Account switched successfully.',
      settings,
    };
  }

  async deactivateAccount(accountId: string, reason: string): Promise<{ userId: string; status: string; reason: string; message: string; settings: AccountSettings }> {
    const settings = this.ensureSettings(accountId);
    settings.deactivated = true;
    settings.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'security', 'Account deactivated', { reason });

    if (this.usersService?.deactivate) {
      await this.usersService.deactivate(accountId);
    }

    return {
      userId: accountId,
      status: 'deactivated',
      reason,
      message: 'Account deactivated successfully.',
      settings,
    };
  }

  async reactivateAccount(accountId: string): Promise<{ userId: string; status: string; message: string; settings: AccountSettings }> {
    const settings = this.ensureSettings(accountId);
    settings.deactivated = false;
    settings.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'security', 'Account reactivated', {});

    if (this.usersService?.reactivate) {
      await this.usersService.reactivate(accountId);
    }

    return {
      userId: accountId,
      status: 'active',
      message: 'Account reactivated successfully.',
      settings,
    };
  }

  async linkAccount(accountId: string, provider: string, externalUserId: string, metadata: Record<string, any> = {}): Promise<LinkedAccount> {
    const accounts = this.linkedAccounts.get(accountId) ?? [];
    const existing = accounts.find((entry) => entry.provider === provider && entry.externalUserId === externalUserId);
    if (existing) {
      return existing;
    }

    const linked: LinkedAccount = {
      id: `linked-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      provider,
      externalUserId,
      displayName: metadata.displayName,
      email: metadata.email,
      connectedAt: new Date().toISOString(),
      isPrimary: accounts.length === 0,
    };

    accounts.unshift(linked);
    this.linkedAccounts.set(accountId, accounts);
    this.recordHistory(accountId, 'security', `Linked ${provider} account`, { provider, externalUserId });
    return linked;
  }

  async unlinkAccount(accountId: string, provider: string): Promise<{ accountId: string; provider: string; unlinked: boolean; message: string }> {
    const accounts = this.linkedAccounts.get(accountId) ?? [];
    const filtered = accounts.filter((entry) => entry.provider !== provider);
    this.linkedAccounts.set(accountId, filtered);
    this.recordHistory(accountId, 'security', `Unlinked ${provider} account`, { provider });
    return { accountId, provider, unlinked: true, message: 'Account disconnected successfully.' };
  }

  getLinkedAccounts(accountId: string): LinkedAccount[] {
    return this.linkedAccounts.get(accountId) ?? [];
  }

  async updatePermissions(accountId: string, permissions: string[]): Promise<{ accountId: string; permissions: string[]; updatedAt: string }> {
    const settings = this.ensureSettings(accountId);
    settings.permissions = Array.from(new Set(permissions));
    settings.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'settings', 'Updated account permissions', { permissions: settings.permissions });

    return {
      accountId,
      permissions: settings.permissions,
      updatedAt: settings.updatedAt,
    };
  }

  async updateAccountPreferences(accountId: string, preferences: Partial<AccountPreferences>): Promise<AccountPreferences> {
    const current = this.ensureAccountPreferences(accountId);
    const next: AccountPreferences = {
      ...current,
      ...preferences,
      updatedAt: new Date().toISOString(),
    };

    this.accountPreferences.set(accountId, next);
    this.recordHistory(accountId, 'settings', 'Updated account preferences', { preferences: next });
    return next;
  }

  async getAccountPreferences(accountId: string): Promise<AccountPreferences> {
    return this.ensureAccountPreferences(accountId);
  }

  async updateNotificationPreferences(accountId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = this.ensureNotificationPreferences(accountId);
    const next: NotificationPreferences = {
      ...current,
      ...preferences,
      updatedAt: new Date().toISOString(),
    };

    this.notificationPreferences.set(accountId, next);
    this.recordHistory(accountId, 'settings', 'Updated notification preferences', { preferences: next });
    return next;
  }

  async getNotificationPreferences(accountId: string): Promise<NotificationPreferences> {
    return this.ensureNotificationPreferences(accountId);
  }

  async registerTrustedDevice(accountId: string, deviceName: string, deviceId: string, metadata: Record<string, any> = {}): Promise<TrustedDevice> {
    const devices = this.ensureTrustedDevices(accountId);
    const now = new Date().toISOString();
    const existing = devices.find((device) => device.deviceId === deviceId);
    if (existing) {
      existing.deviceName = deviceName;
      existing.platform = metadata.platform ?? existing.platform;
      existing.metadata = metadata;
      existing.lastSeenAt = now;
      this.recordHistory(accountId, 'security', `Trusted device refreshed: ${deviceName}`, { deviceId });
      return existing;
    }

    const newDevice: TrustedDevice = {
      id: `device-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      deviceName,
      deviceId,
      platform: metadata.platform,
      metadata,
      lastSeenAt: now,
      createdAt: now,
    };

    devices.unshift(newDevice);
    this.recordHistory(accountId, 'security', `Trusted device added: ${deviceName}`, { deviceId });
    return newDevice;
  }

  async revokeTrustedDevice(accountId: string, deviceId: string): Promise<{ accountId: string; deviceId: string; revoked: boolean; message: string }> {
    const devices = this.ensureTrustedDevices(accountId);
    const remaining = devices.filter((device) => device.deviceId !== deviceId);
    this.trustedDevices.set(accountId, remaining);
    this.recordHistory(accountId, 'security', 'Trusted device revoked', { deviceId });
    return {
      accountId,
      deviceId,
      revoked: true,
      message: 'Trusted device revoked successfully.',
    };
  }

  async getTrustedDevices(accountId: string): Promise<TrustedDevice[]> {
    return this.ensureTrustedDevices(accountId);
  }

  async updatePersonalization(accountId: string, settings: Record<string, any>): Promise<{ accountId: string; personalizationSettings: Record<string, any>; updatedAt: string }> {
    const account = this.ensureSettings(accountId);
    account.personalizationSettings = {
      ...account.personalizationSettings,
      ...settings,
    };
    account.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'settings', 'Updated personalization settings', { settings: account.personalizationSettings });

    return {
      accountId,
      personalizationSettings: account.personalizationSettings,
      updatedAt: account.updatedAt,
    };
  }

  async updateDataPermissions(accountId: string, dataTypes: string[]): Promise<{ accountId: string; dataPermissions: string[]; updatedAt: string }> {
    const settings = this.ensureSettings(accountId);
    settings.dataPermissions = Array.from(new Set(dataTypes));
    settings.updatedAt = new Date().toISOString();
    this.recordHistory(accountId, 'settings', 'Updated data permissions', { dataTypes: settings.dataPermissions });

    return {
      accountId,
      dataPermissions: settings.dataPermissions,
      updatedAt: settings.updatedAt,
    };
  }

  async getAccountSecuritySettings(accountId: string): Promise<AccountSecurityFeatureSettings> {
    return this.ensureAccountSecuritySettings(accountId);
  }

  async updateAccountSecuritySettings(
    accountId: string,
    updates: Partial<AccountSecurityFeatureSettings>,
  ): Promise<AccountSecurityFeatureSettings> {
    const current = this.ensureAccountSecuritySettings(accountId);
    const next: AccountSecurityFeatureSettings = {
      ...current,
      ...updates,
      accountId,
      updatedAt: new Date().toISOString(),
    };

    this.accountSecuritySettings.set(accountId, next);
    this.recordHistory(accountId, 'security', 'Account security settings updated', { settings: next });
    return next;
  }

  async getAccountSecuritySummary(accountId: string): Promise<{
    accountId: string;
    features: AccountSecurityFeatureSettings;
    enabledCount: number;
    totalCount: number;
    riskLevel: 'low' | 'medium' | 'high';
    nextActions: string[];
    updatedAt: string;
  }> {
    const settings = this.ensureAccountSecuritySettings(accountId);
    const totalCount = 10;
    const enabledCount = [
      settings.twoFactorAuthentication,
      settings.biometricAuthentication,
      settings.passkeysEnabled,
      settings.recoveryCodesEnabled,
      settings.loginApprovalsEnabled,
      settings.suspiciousLoginAlertsEnabled,
      settings.deviceManagementEnabled,
      settings.sessionManagementEnabled,
      settings.accountRecoveryEnabled,
      settings.securityCenterEnabled,
    ].filter(Boolean).length;

    const enabledRatio = enabledCount / totalCount;
    const riskLevel: 'low' | 'medium' | 'high' = enabledRatio >= 0.8 ? 'low' : enabledRatio >= 0.5 ? 'medium' : 'high';
    const nextActions = [] as string[];

    if (!settings.twoFactorAuthentication) nextActions.push('Enable two-factor authentication');
    if (!settings.biometricAuthentication) nextActions.push('Enable biometric authentication');
    if (!settings.passkeysEnabled) nextActions.push('Register a passkey for passwordless sign-in');
    if (!settings.recoveryCodesEnabled) nextActions.push('Generate recovery codes');
    if (!settings.suspiciousLoginAlertsEnabled) nextActions.push('Turn on suspicious login alerts');

    return {
      accountId,
      features: settings,
      enabledCount,
      totalCount,
      riskLevel,
      nextActions,
      updatedAt: settings.updatedAt,
    };
  }

  async getAccountHistory(accountId: string): Promise<AccountHistoryEntry[]> {
    return this.ensureHistory(accountId);
  }

  async startAccountRecovery(accountId: string, method: 'email' | 'trusted_contact' | 'passkey' = 'email'): Promise<{ accountId: string; status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string }> {
    const createdAt = new Date().toISOString();
    const result = { accountId, status: 'pending' as const, method, createdAt };
    this.recoveryQueue.set(accountId, result);
    this.recordHistory(accountId, 'recovery', 'Account recovery started', { method });
    return result;
  }

  async completeAccountRecovery(accountId: string, approved = true): Promise<{ accountId: string; status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string }> {
    const existing = this.recoveryQueue.get(accountId) ?? {
      accountId,
      status: 'pending' as const,
      method: 'email',
      createdAt: new Date().toISOString(),
    };
    const next = {
      ...existing,
      accountId,
      status: (approved ? 'approved' : 'rejected') as 'pending' | 'approved' | 'rejected',
    };
    this.recoveryQueue.set(accountId, next);
    this.recordHistory(accountId, 'recovery', approved ? 'Account recovery approved' : 'Account recovery rejected', { method: next.method });
    return next;
  }

  async submitVerificationAppeal(accountId: string, reason: string, links: string[] = []): Promise<VerificationAppeal> {
    const appeals = this.verificationAppeals.get(accountId) ?? [];
    const submission: VerificationAppeal = {
      id: `appeal-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      reason,
      links,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    appeals.unshift(submission);
    this.verificationAppeals.set(accountId, appeals);
    this.recordHistory(accountId, 'verification', 'Verification appeal submitted', { appealId: submission.id });
    return submission;
  }

  async reviewVerificationAppeal(accountId: string, appealId: string, status: 'approved' | 'rejected'): Promise<VerificationAppeal | null> {
    const appeals = this.verificationAppeals.get(accountId) ?? [];
    const appeal = appeals.find((entry) => entry.id === appealId);
    if (!appeal) {
      return null;
    }
    appeal.status = status;
    appeal.reviewedAt = new Date().toISOString();
    this.recordHistory(accountId, 'verification', `Verification appeal ${status}`, { appealId });
    return appeal;
  }

  async updatePrivacySettings(accountId: string, settings: Partial<PrivacySettingsSnapshot>): Promise<PrivacySettingsSnapshot> {
    const current = this.ensurePrivacy(accountId);
    const next: PrivacySettingsSnapshot = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    this.privacySettings.set(accountId, next);
    this.recordHistory(accountId, 'settings', 'Privacy settings updated', { settings: next });
    return next;
  }

  private ensureDefaultPrivacySettings(accountId: string): PrivacySettingsSnapshot {
    return this.ensurePrivacy(accountId);
  }

  async createAccountProfile(
    accountId: string,
    payload: { label?: string; accountType?: AccountProfile['accountType']; isPrimary?: boolean; id?: string } = {},
  ): Promise<AccountProfile> {
    const profiles = this.accountProfiles.get(accountId) ?? [];
    const now = new Date().toISOString();
    const profileId = payload.id ?? (profiles.length === 0 ? accountId : `profile-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);

    const profile: AccountProfile = {
      id: profileId,
      accountId,
      label: payload.label ?? (profiles.length === 0 ? 'Primary' : `Account ${profiles.length + 1}`),
      accountType: payload.accountType ?? 'personal',
      isPrimary: payload.isPrimary ?? profiles.length === 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const nextProfiles = [profile, ...profiles.filter((entry) => entry.id !== profileId)];
    this.accountProfiles.set(accountId, nextProfiles);
    this.recordHistory(accountId, 'settings', 'Account profile created', { profileId: profile.id, label: profile.label });
    return profile;
  }

  listAccountProfiles(accountId: string): AccountProfile[] {
    return this.accountProfiles.get(accountId) ?? [];
  }

  async setPrimaryAccountProfile(accountId: string, profileId: string): Promise<AccountProfile | null> {
    const profiles = this.accountProfiles.get(accountId) ?? [];
    const profile = profiles.find((entry) => entry.id === profileId);
    if (!profile) {
      return null;
    }

    for (const entry of profiles) {
      entry.isPrimary = entry.id === profileId;
      entry.updatedAt = new Date().toISOString();
    }

    this.accountProfiles.set(accountId, profiles);
    this.recordHistory(accountId, 'settings', 'Primary account profile updated', { profileId });
    return profile;
  }

  async getIdentitySettings(accountId: string): Promise<IdentitySettings> {
    const existing = this.identitySettingsMap.get(accountId);
    if (existing) {
      return existing;
    }

    const initial: IdentitySettings = {
      accountId,
      displayName: 'User',
      bio: '',
      publicProfile: true,
      creatorMode: false,
      businessMode: false,
      ageVerified: false,
      enhancedSecurity: true,
      verificationRequired: false,
      updatedAt: new Date().toISOString(),
    };

    this.identitySettingsMap.set(accountId, initial);
    return initial;
  }

  async updateIdentitySettings(accountId: string, settings: Partial<IdentitySettings>): Promise<IdentitySettings> {
    const current = await this.getIdentitySettings(accountId);
    const next: IdentitySettings = {
      ...current,
      ...settings,
      accountId,
      updatedAt: new Date().toISOString(),
    };

    this.identitySettingsMap.set(accountId, next);
    this.recordHistory(accountId, 'settings', 'Identity settings updated', { settings: next });
    return next;
  }

  async requestAgeVerification(accountId: string, verificationDate?: Date): Promise<{ accountId: string; status: 'pending' | 'verified'; verifiedAt?: string }> {
    const current = await this.getIdentitySettings(accountId);
    current.ageVerified = Boolean(verificationDate) || current.ageVerified;
    current.updatedAt = new Date().toISOString();
    this.identitySettingsMap.set(accountId, current);
    this.recordHistory(accountId, 'verification', 'Age verification requested', { accountId });

    return {
      accountId,
      status: current.ageVerified ? 'verified' : 'pending',
      verifiedAt: current.ageVerified ? current.updatedAt : undefined,
    };
  }

  async submitDocumentVerification(accountId: string, documentType: string, documentUrl: string): Promise<{ accountId: string; documentType: string; status: 'pending'; documentUrl: string; submittedAt: string }> {
    const submittedAt = new Date().toISOString();
    this.recordHistory(accountId, 'verification', 'Document verification submitted', { documentType, documentUrl });

    return {
      accountId,
      documentType,
      status: 'pending',
      documentUrl,
      submittedAt,
    };
  }

  async getTrustIndicators(accountId: string): Promise<{ accountId: string; verified: boolean; badges: string[]; trustScore: number; updatedAt: string }> {
    const existing = this.trustIndicatorsMap.get(accountId);
    if (existing) {
      return { ...existing, accountId };
    }

    const initial = {
      accountId,
      verified: false,
      badges: [],
      trustScore: 0,
      updatedAt: new Date().toISOString(),
    };

    this.trustIndicatorsMap.set(accountId, initial);
    return initial;
  }

  async updateTrustIndicators(
    accountId: string,
    settings: Partial<{ verified: boolean; badges: string[]; trustScore: number }>,
  ): Promise<{ accountId: string; verified: boolean; badges: string[]; trustScore: number; updatedAt: string }> {
    const current = await this.getTrustIndicators(accountId);
    const next = {
      accountId,
      verified: settings.verified ?? current.verified,
      badges: settings.badges ?? current.badges,
      trustScore: settings.trustScore ?? current.trustScore,
      updatedAt: new Date().toISOString(),
    };

    this.trustIndicatorsMap.set(accountId, next);
    this.recordHistory(accountId, 'verification', 'Trust indicators updated', { badges: next.badges, trustScore: next.trustScore });
    return next;
  }

  async exportAccountData(
    accountId: string,
    options: {
      includeSecurityLog?: boolean;
      includeLinkedAccounts?: boolean;
      includePrivacySettings?: boolean;
      includeHistory?: boolean;
      format?: 'json' | 'csv';
    } = {},
  ): Promise<{ accountId: string; status: 'ready'; fileUrl: string; generatedAt: string; format: string; includes: Record<string, boolean> }> {
    const format = options.format ?? 'json';
    const now = new Date().toISOString();
    const fileUrl = `/exports/account/${accountId}-${Date.now()}.${format}`;
    const includes = {
      securityLog: !!options.includeSecurityLog,
      linkedAccounts: !!options.includeLinkedAccounts,
      privacySettings: !!options.includePrivacySettings,
      history: !!options.includeHistory,
    };

    this.recordHistory(accountId, 'settings', 'Account data exported', { fileUrl, includes, format });
    return {
      accountId,
      status: 'ready',
      fileUrl,
      generatedAt: now,
      format,
      includes,
    };
  }

  async createAccountSession(accountId: string, deviceName: string, ipAddress?: string, userAgent?: string): Promise<AccountSession> {
    const sessions = this.accountSessions.get(accountId) ?? [];
    const now = new Date().toISOString();
    const session: AccountSession = {
      id: `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      deviceName,
      ipAddress,
      userAgent,
      isCurrent: sessions.length === 0,
      createdAt: now,
      lastSeenAt: now,
      status: 'active',
    };

    sessions.unshift(session);
    this.accountSessions.set(accountId, sessions);
    this.recordHistory(accountId, 'security', 'Account session created', { sessionId: session.id, deviceName, ipAddress });
    return session;
  }

  async listAccountSessions(accountId: string): Promise<AccountSession[]> {
    return this.accountSessions.get(accountId) ?? [];
  }

  async revokeAccountSession(accountId: string, sessionId: string): Promise<{ accountId: string; sessionId: string; revoked: boolean; message: string }> {
    const sessions = this.accountSessions.get(accountId) ?? [];
    const target = sessions.find((entry) => entry.id === sessionId);
    if (!target) {
      return { accountId, sessionId, revoked: false, message: 'Session not found.' };
    }

    target.status = 'revoked';
    target.lastSeenAt = new Date().toISOString();
    this.recordHistory(accountId, 'security', 'Account session revoked', { sessionId });
    return { accountId, sessionId, revoked: true, message: 'Session revoked successfully.' };
  }

  async revokeAllOtherSessions(accountId: string, currentSessionId?: string): Promise<{ accountId: string; revoked: boolean; message: string }> {
    const sessions = this.accountSessions.get(accountId) ?? [];
    const updated = sessions.map((session) => {
      const shouldRevoke = session.id !== currentSessionId && session.status !== 'revoked';
      if (shouldRevoke) {
        session.status = 'revoked';
        session.lastSeenAt = new Date().toISOString();
      }
      return session;
    });

    this.accountSessions.set(accountId, updated);
    this.recordHistory(accountId, 'security', 'Other account sessions revoked', { currentSessionId });

    return { accountId, revoked: true, message: 'Other sessions revoked successfully.' };
  }

  async requestDataDownload(accountId: string, dataTypes: string[] = []): Promise<{ accountId: string; status: 'ready'; fileUrl: string; createdAt: string; dataTypes: string[] }> {
    const createdAt = new Date().toISOString();
    const fileUrl = `/downloads/account/${accountId}-${Date.now()}.zip`;
    const requests = this.dataDownloadRequests.get(accountId) ?? [];
    const entry = { id: `download-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, accountId, dataTypes, status: 'ready' as const, fileUrl, createdAt };
    requests.unshift(entry);
    this.dataDownloadRequests.set(accountId, requests);
    this.recordHistory(accountId, 'settings', 'Data download requested', { dataTypes, fileUrl });
    return { accountId, status: 'ready', fileUrl, createdAt, dataTypes };
  }

  async requestDataDeletion(accountId: string, dataTypes: string[] = [], reason = 'User requested deletion'): Promise<{ accountId: string; status: 'queued'; id: string; reason: string; dataTypes: string[]; createdAt: string }> {
    const createdAt = new Date().toISOString();
    const requests = this.dataDeletionRequests.get(accountId) ?? [];
    const entry = { id: `delete-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, accountId, dataTypes, reason, status: 'queued' as const, createdAt };
    requests.unshift(entry);
    this.dataDeletionRequests.set(accountId, requests);
    this.recordHistory(accountId, 'security', 'Data deletion requested', { dataTypes, reason, deletionId: entry.id });
    return { accountId, status: 'queued', id: entry.id, reason, dataTypes, createdAt };
  }

  async requestAccountDeletion(
    accountId: string,
    payload: {
      reason?: string;
      additionalInfo?: string;
      deleteLinkedAccounts?: boolean;
      deleteAllData?: boolean;
    } = {},
  ): Promise<{ accountId: string; status: 'pending'; message: string; reason: string; createdAt: string; deleteLinkedAccounts: boolean; deleteAllData: boolean }> {
    const createdAt = new Date().toISOString();
    const request = {
      id: `deletion-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      reason: payload.reason ?? 'not_using',
      additionalInfo: payload.additionalInfo,
      deleteLinkedAccounts: payload.deleteLinkedAccounts ?? true,
      deleteAllData: payload.deleteAllData ?? true,
      status: 'pending' as const,
      createdAt,
    };

    this.accountDeletionRequests.set(accountId, request);
    this.recordHistory(accountId, 'security', 'Account deletion requested', {
      reason: request.reason,
      deleteLinkedAccounts: request.deleteLinkedAccounts,
      deleteAllData: request.deleteAllData,
      requestId: request.id,
    });

    const settings = this.ensureSettings(accountId);
    settings.deactivated = true;
    settings.updatedAt = new Date().toISOString();

    return {
      accountId,
      status: 'pending',
      message: 'Account deletion has been requested and is pending confirmation.',
      reason: request.reason,
      createdAt,
      deleteLinkedAccounts: request.deleteLinkedAccounts,
      deleteAllData: request.deleteAllData,
    };
  }

  async confirmAccountDeletion(accountId: string, confirmationCode: string): Promise<{ accountId: string; status: 'deleted'; message: string; deletedAt: string }> {
    const existing = this.accountDeletionRequests.get(accountId);
    if (!existing) {
      throw new Error('No account deletion request is pending for this account.');
    }

    if (confirmationCode.trim().toUpperCase() !== 'DELETE') {
      throw new Error('Invalid deletion confirmation code.');
    }

    const deletedAt = new Date().toISOString();
    const settings = this.ensureSettings(accountId);
    settings.deactivated = true;
    settings.updatedAt = deletedAt;

    this.accountDeletionRequests.set(accountId, {
      ...existing,
      status: 'deleted',
      processedAt: deletedAt,
    });
    this.recordHistory(accountId, 'security', 'Account deleted permanently', {
      requestId: existing.id,
      deletedAt,
      deleteLinkedAccounts: existing.deleteLinkedAccounts,
      deleteAllData: existing.deleteAllData,
    });

    if (this.usersService?.delete) {
      await this.usersService.delete(accountId);
    }

    return {
      accountId,
      status: 'deleted',
      message: 'Account deleted successfully and all associated data has been queued for removal.',
      deletedAt,
    };
  }

  async recordSecurityAlert(
    accountId: string,
    type: SecurityAlert['type'],
    message: string,
    severity: SecurityAlert['severity'] = 'medium',
    metadata: Record<string, any> = {},
  ): Promise<SecurityAlert> {
    const alerts = this.securityAlerts.get(accountId) ?? [];
    const alert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      type,
      message,
      severity,
      createdAt: new Date().toISOString(),
      resolved: false,
      metadata,
    };

    alerts.unshift(alert);
    this.securityAlerts.set(accountId, alerts);
    this.recordHistory(accountId, 'security', `Security alert: ${message}`, { type, severity, metadata });
    return alert;
  }

  async resolveSecurityAlert(accountId: string, alertId: string, resolved = true): Promise<SecurityAlert | null> {
    const alerts = this.securityAlerts.get(accountId) ?? [];
    const alert = alerts.find((entry) => entry.id === alertId);
    if (!alert) {
      return null;
    }

    alert.resolved = resolved;
    this.recordHistory(accountId, 'security', resolved ? 'Security alert resolved' : 'Security alert reopened', { alertId });
    return alert;
  }

  async createLoginApproval(
    accountId: string,
    details: { deviceName?: string; ipAddress?: string; userAgent?: string; location?: string } = {},
  ): Promise<LoginApprovalRequest> {
    const approvals = this.loginApprovals.get(accountId) ?? [];
    const approval: LoginApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      deviceName: details.deviceName ?? 'Unknown device',
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      location: details.location,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    approvals.unshift(approval);
    this.loginApprovals.set(accountId, approvals);
    this.recordHistory(accountId, 'security', 'Login approval requested', {
      approvalId: approval.id,
      deviceName: approval.deviceName,
      ipAddress: approval.ipAddress,
      location: approval.location,
    });
    return approval;
  }

  async reviewLoginApproval(accountId: string, approvalId: string, approved: boolean, note?: string): Promise<LoginApprovalRequest> {
    const approvals = this.loginApprovals.get(accountId) ?? [];
    const approval = approvals.find((entry) => entry.id === approvalId);
    if (!approval) {
      throw new Error('Login approval not found.');
    }

    approval.status = approved ? 'approved' : 'rejected';
    approval.reviewedAt = new Date().toISOString();
    approval.reviewerNote = note;
    this.recordHistory(accountId, 'security', approved ? 'Login approval approved' : 'Login approval rejected', {
      approvalId,
      note,
    });

    return approval;
  }

  async importAccountData(accountId: string, payload: Record<string, any>): Promise<{ accountId: string; imported: boolean; summary: string }> {
    this.recordHistory(accountId, 'settings', 'Account data imported', { payloadKeys: Object.keys(payload ?? {}) });
    return {
      accountId,
      imported: true,
      summary: 'Account data imported successfully.',
    };
  }

  async getPrivacySettings(accountId: string): Promise<PrivacySettingsSnapshot> {
    return this.ensurePrivacy(accountId);
  }

  async getPrivacySummary(accountId: string): Promise<{
    accountId: string;
    showOnlineStatus: boolean;
    readReceipts: boolean;
    mentions: PrivacySettingsSnapshot['mentions'];
    activityVisibility: PrivacySettingsSnapshot['activityVisibility'];
    storyVisibility: PrivacySettingsSnapshot['storyVisibility'];
    searchVisibility: PrivacySettingsSnapshot['searchVisibility'];
    contactDiscovery: boolean;
    personalization: boolean;
    adPersonalization: boolean;
    protectionLevel: 'strong' | 'balanced' | 'limited';
    blockedDefaults: string[];
    updatedAt: string;
  }> {
    const settings = this.ensurePrivacy(accountId);

    const blockedDefaults: string[] = [];
    if (!settings.contactDiscovery) blockedDefaults.push('contact discovery');
    if (!settings.adPersonalization) blockedDefaults.push('ad personalization');
    if (settings.activityVisibility === 'private') blockedDefaults.push('activity visibility');
    if (settings.storyVisibility === 'only_me') blockedDefaults.push('story visibility');

    const restrictedCount = [
      settings.showOnlineStatus,
      settings.readReceipts,
      settings.contactDiscovery,
      settings.personalization,
      settings.adPersonalization,
    ].filter((value) => value === false).length;

    const protectionLevel = restrictedCount >= 4 ? 'strong' : restrictedCount >= 2 ? 'balanced' : 'limited';

    return {
      accountId,
      showOnlineStatus: settings.showOnlineStatus,
      readReceipts: settings.readReceipts,
      mentions: settings.mentions,
      activityVisibility: settings.activityVisibility,
      storyVisibility: settings.storyVisibility,
      searchVisibility: settings.searchVisibility,
      contactDiscovery: settings.contactDiscovery,
      personalization: settings.personalization,
      adPersonalization: settings.adPersonalization,
      protectionLevel,
      blockedDefaults,
      updatedAt: settings.updatedAt,
    };
  }

  async getAccountDashboard(accountId: string): Promise<{
    account: AccountSettings;
    preferences: AccountPreferences;
    notifications: NotificationPreferences;
    linkedAccounts: LinkedAccount[];
    history: AccountHistoryEntry[];
    privacy: PrivacySettingsSnapshot;
    recoveryStatus: { accountId: string; status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string } | null;
    appeals: VerificationAppeal[];
    securityCenter: Awaited<ReturnType<AccountManagementService['getSecurityCenter']>>;
  }> {
    const [history, privacy, securityCenter, preferences, notifications] = await Promise.all([
      this.getAccountHistory(accountId),
      this.getPrivacySettings(accountId),
      this.getSecurityCenter(accountId),
      this.getAccountPreferences(accountId),
      this.getNotificationPreferences(accountId),
    ]);

    const recoveryStatus = this.recoveryQueue.get(accountId);

    return {
      account: this.ensureSettings(accountId),
      preferences,
      notifications,
      linkedAccounts: this.getLinkedAccounts(accountId),
      history,
      privacy,
      recoveryStatus: recoveryStatus
        ? { ...recoveryStatus, accountId }
        : null,
      appeals: this.verificationAppeals.get(accountId) ?? [],
      securityCenter,
    };
  }

  async requestIdentityVerification(accountId: string, reason: string, links: string[] = []) {
    return this.submitVerificationAppeal(accountId, `Identity verification: ${reason}`, links);
  }

  async requestCreatorVerification(accountId: string, reason: string, links: string[] = []) {
    return this.submitVerificationAppeal(accountId, `Creator verification: ${reason}`, links);
  }

  async requestBusinessVerification(accountId: string, reason: string, links: string[] = []) {
    return this.submitVerificationAppeal(accountId, `Business verification: ${reason}`, links);
  }

  async requestOrganizationVerification(accountId: string, reason: string, links: string[] = []) {
    return this.submitVerificationAppeal(accountId, `Organization verification: ${reason}`, links);
  }

  async getVerificationStatus(accountId: string): Promise<{
    accountId: string;
    verified: boolean;
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    type: 'identity' | 'creator' | 'business' | 'organization' | 'other';
    appealId?: string;
    reviewedAt?: string;
    appeals: VerificationAppeal[];
  }> {
    const appeals = this.verificationAppeals.get(accountId) ?? [];
    const latest = appeals[0] ?? null;
    const status = latest ? (latest.status === 'approved' ? 'approved' : latest.status === 'rejected' ? 'rejected' : 'pending') : 'not_started';
    const type = latest?.reason.toLowerCase().includes('creator') ? 'creator' : latest?.reason.toLowerCase().includes('business') ? 'business' : latest?.reason.toLowerCase().includes('organization') ? 'organization' : latest?.reason.toLowerCase().includes('identity') ? 'identity' : 'other';

    return {
      accountId,
      verified: status === 'approved',
      status,
      type,
      appealId: latest?.id,
      reviewedAt: latest?.reviewedAt,
      appeals,
    };
  }

  async getVerificationSummary(accountId: string): Promise<{
    accountId: string;
    verified: boolean;
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    type: 'identity' | 'creator' | 'business' | 'organization' | 'other';
    badges: string[];
    trustScore: number;
    reviewCount: number;
    lastUpdatedAt?: string;
  }> {
    const verification = await this.getVerificationStatus(accountId);
    const trust = await this.getTrustIndicators(accountId);
    const appeals = this.verificationAppeals.get(accountId) ?? [];

    return {
      accountId,
      verified: verification.verified,
      status: verification.status,
      type: verification.type,
      badges: trust.badges ?? [],
      trustScore: trust.trustScore ?? 0,
      reviewCount: appeals.length,
      lastUpdatedAt: trust.updatedAt,
    };
  }

  async getVerificationHistory(accountId: string): Promise<VerificationAppeal[]> {
    return this.verificationAppeals.get(accountId) ?? [];
  }

  async getSecurityCenter(accountId: string): Promise<{
    accountId: string;
    exportUrl: string;
    logs: Array<{ id: string; message: string; timestamp: string; type: string }>;
    connectedAccounts: LinkedAccount[];
    trustedDevices: TrustedDevice[];
    recoveryStatus: { status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string } | null;
    pendingAppeals: VerificationAppeal[];
    securityAlerts: SecurityAlert[];
    pendingApprovals: LoginApprovalRequest[];
  }> {
    const logs = this.ensureHistory(accountId).slice(0, 25).map((entry) => ({
      id: entry.id,
      message: entry.summary,
      timestamp: entry.occurredAt,
      type: entry.type,
    }));

    const [connectedAccounts, trustedDevices] = await Promise.all([
      Promise.resolve(this.getLinkedAccounts(accountId)),
      this.getTrustedDevices(accountId),
    ]);

    return {
      accountId,
      exportUrl: `/security-log/${accountId}.json`,
      logs,
      connectedAccounts,
      trustedDevices,
      recoveryStatus: this.recoveryQueue.get(accountId) ?? null,
      pendingAppeals: (this.verificationAppeals.get(accountId) ?? []).filter((entry) => entry.status === 'pending'),
      securityAlerts: this.securityAlerts.get(accountId) ?? [],
      pendingApprovals: (this.loginApprovals.get(accountId) ?? []).filter((entry) => entry.status === 'pending'),
    };
  }

  async exportSecurityLog(accountId: string): Promise<{ accountId: string; exportUrl: string; generatedAt: string; records: AccountHistoryEntry[] }> {
    const records = this.ensureHistory(accountId);
    return {
      accountId,
      exportUrl: `/security-log/${accountId}.json`,
      generatedAt: new Date().toISOString(),
      records,
    };
  }
}

export const accountManagementService = new AccountManagementService();
