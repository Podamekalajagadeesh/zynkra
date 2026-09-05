import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityAlertEntity } from './entities/security-alert.entity';
import { LinkedAccount as LinkedAccountEntity } from './entities/linked-account.entity';
import { AccountProfileEntity, AccountProfileType } from './entities/account-profile.entity';
import { SecurityAuditService } from '../../security-audit/security-audit.service';
import { User } from '../../users/entities/user.entity';
import { AccountDeletionRequest } from './entities/account-deletion-request.entity';
import { AccountHistoryEntity } from './entities/account-history.entity';
import { AccountSessionEntity } from './entities/account-session.entity';
import { AccountRecoveryRequest, AccountRecoveryRequestStatus } from './entities/account-recovery-request.entity';
import { UsersService } from '../../users/users.service';
import { LoginSession } from '../../auth/entities/login-session.entity';
import { DataPermission } from './dto/data-permissions.dto';
import { DEFAULT_DATA_PERMISSIONS } from '../../common/data-permissions/data-permissions.service';

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
  appIcon: 'default' | 'neon' | 'ocean' | 'sunset' | 'creator-classic' | 'creator-vibrant' | 'creator-minimal';
  language: string;
  timezone: string;
  defaultPrivacy: 'public' | 'friends' | 'private';
  keyboardNavigationEnabled: boolean;
  autoTranslate: boolean;
  feedSort: 'algorithmic' | 'chronological';
  screenTimeEnabled: boolean;
  dailyScreenTimeLimit: number;
  contentWarningsEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  voiceControlEnabled: boolean;
  largeTextMode: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  customSettings: Record<string, any>;
  updatedAt: string;
}

export interface NotificationPreferences {
  emailDigest: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  securityAlerts: boolean;
  notifyNewFollower: boolean;
  notifyMentions: boolean;
  notifyMessages: boolean;
  notifyComments: boolean;
  notifyLikes: boolean;
  customNotifications: Record<string, boolean>;
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
  isCurrent?: boolean;
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

@Injectable()
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
  private readonly activeAccountProfileByAccount = new Map<string, string>();
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
    @Optional()
    private readonly usersService?: UsersService,
    @Optional()
    @InjectRepository(User)
    private readonly usersRepository?: Repository<User>,
    @Optional()
    @InjectRepository(LinkedAccountEntity)
    private readonly linkedAccountsRepository?: Repository<LinkedAccountEntity>,
    @Optional()
    @InjectRepository(SecurityAlertEntity)
    private readonly securityAlertsRepository?: Repository<SecurityAlertEntity>,
    @Optional()
    @InjectRepository(AccountProfileEntity)
    private readonly accountProfilesRepository?: Repository<AccountProfileEntity>,
    @Optional()
    private readonly securityAuditService?: SecurityAuditService,
    @Optional()
    @InjectRepository(AccountDeletionRequest)
    private readonly accountDeletionRepository?: Repository<AccountDeletionRequest>,
    @Optional()
    @InjectRepository(AccountHistoryEntity)
    private readonly accountHistoryRepository?: Repository<AccountHistoryEntity>,
    @Optional()
    @InjectRepository(AccountSessionEntity)
    private readonly accountSessionsRepository?: Repository<AccountSessionEntity>,
    @Optional()
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository?: Repository<LoginSession>,
    @Optional()
    @InjectRepository(AccountRecoveryRequest)
    private readonly accountRecoveryRepository?: Repository<AccountRecoveryRequest>,
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
      dataPermissions: [...DEFAULT_DATA_PERMISSIONS],
      updatedAt: new Date().toISOString(),
    };

    this.accountSettings.set(accountId, initial);
    return initial;
  }

  private async getPersistedUser(accountId: string): Promise<User | null> {
    if (!this.usersRepository) {
      return null;
    }

    return this.usersRepository.findOne({ where: { id: accountId } });
  }

  private async getPersistedLinkedAccounts(accountId: string): Promise<LinkedAccountEntity[]> {
    if (!this.linkedAccountsRepository) {
      return [];
    }

    return this.linkedAccountsRepository.find({
      where: { userId: accountId, isActive: true },
      order: { connectedAt: 'DESC' },
    });
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
      appIcon: 'default',
      language: 'en-US',
      timezone: 'UTC',
      defaultPrivacy: 'friends',
      keyboardNavigationEnabled: false,
      autoTranslate: true,
      feedSort: 'algorithmic',
      screenTimeEnabled: false,
      dailyScreenTimeLimit: 120,
      contentWarningsEnabled: true,
      highContrastMode: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      voiceControlEnabled: false,
      largeTextMode: false,
      colorBlindMode: 'none',
      customSettings: {},
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
      notifyNewFollower: true,
      notifyMentions: true,
      notifyMessages: true,
      notifyComments: true,
      notifyLikes: true,
      customNotifications: {},
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
    const entry: AccountHistoryEntry = {
      id: `history-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type,
      summary,
      occurredAt: new Date().toISOString(),
      metadata,
    };
    history.unshift(entry);

    if (this.accountHistoryRepository) {
      const persisted = this.accountHistoryRepository.create({
        ...entry,
        userId: accountId,
        createdAt: new Date(entry.occurredAt),
      });
      void this.accountHistoryRepository.save(persisted).catch(() => undefined);
    }
  }

  async switchAccount(accountId: string): Promise<{ accountId: string; switched: boolean; message: string; settings: AccountSettings }> {
    const settings = this.ensureSettings(accountId);
    settings.switchingEnabled = true;
    settings.updatedAt = new Date().toISOString();

    const profiles = this.accountProfiles.get(accountId) ?? [];
    if (profiles.length > 0) {
      const activeProfile = profiles.find((profile) => profile.isPrimary) ?? profiles[0];
      if (activeProfile) {
        this.activeAccountProfileByAccount.set(accountId, activeProfile.id);
      }
    }

    this.recordHistory(accountId, 'settings', 'Switched active account context', { accountId });

    return {
      accountId,
      switched: true,
      message: 'Account switched successfully.',
      settings,
    };
  }

  getActiveAccountProfile(accountId: string): AccountProfile | null {
    const activeProfileId = this.activeAccountProfileByAccount.get(accountId);
    if (!activeProfileId) {
      const profiles = this.accountProfiles.get(accountId) ?? [];
      const fallback = profiles.find((profile) => profile.isPrimary) ?? profiles[0] ?? null;
      if (fallback) {
        this.activeAccountProfileByAccount.set(accountId, fallback.id);
      }
      return fallback;
    }

    const profiles = this.accountProfiles.get(accountId) ?? [];
    return profiles.find((profile) => profile.id === activeProfileId) ?? null;
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
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { accountPermissions: settings.permissions });
    }
    this.recordHistory(accountId, 'settings', 'Updated account permissions', { permissions: settings.permissions });

    return {
      accountId,
      permissions: settings.permissions,
      updatedAt: settings.updatedAt,
    };
  }

  async getPermissions(accountId: string): Promise<{ accountId: string; permissions: string[]; updatedAt: string }> {
    if (this.usersRepository) {
      const user = await this.usersRepository.findOne({ where: { id: accountId } });
      if (!user) {
        throw new Error('User not found');
      }

      const settings = this.ensureSettings(accountId);
      if (user.accountPermissions !== null && user.accountPermissions !== undefined) {
        settings.permissions = Array.from(new Set(user.accountPermissions));
      }
      return {
        accountId,
        permissions: settings.permissions,
        updatedAt: settings.updatedAt,
      };
    }

    const settings = this.ensureSettings(accountId);
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
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { accountPreferences: next });
    }
    this.recordHistory(accountId, 'settings', 'Updated account preferences', { preferences: next });
    return next;
  }

  async getAccountPreferences(accountId: string): Promise<AccountPreferences> {
    if (this.usersRepository) {
      const user = await this.usersRepository.findOne({ where: { id: accountId } });
      if (user?.accountPreferences) {
        const preferences: AccountPreferences = {
          ...this.ensureAccountPreferences(accountId),
          ...user.accountPreferences,
          customSettings: user.accountPreferences.customSettings ?? {},
        };
        this.accountPreferences.set(accountId, preferences);
        return preferences;
      }
    }
    return this.ensureAccountPreferences(accountId);
  }

  async updateNotificationPreferences(accountId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    if (this.usersService) {
      const user = await this.usersService.findOneById(accountId);
      if (!user) {
        throw new Error('User not found');
      }

      const current = user.notificationSettings ?? {} as any;
      const next = {
        ...current,
        emailNotifications: preferences.emailDigest ?? current.emailNotifications ?? true,
        emailDigest: preferences.emailDigest ?? current.emailDigest ?? true,
        pushAlerts: preferences.pushAlerts ?? current.pushAlerts ?? true,
        smsAlerts: preferences.smsAlerts ?? current.smsAlerts ?? false,
        securityAlerts: preferences.securityAlerts ?? current.securityAlerts ?? true,
        newFollowers: preferences.notifyNewFollower ?? current.newFollowers ?? true,
        notifyMentions: preferences.notifyMentions ?? current.notifyMentions ?? true,
        messages: preferences.notifyMessages ?? current.messages ?? true,
        comments: preferences.notifyComments ?? current.comments ?? true,
        likes: preferences.notifyLikes ?? current.likes ?? true,
        customNotifications: preferences.customNotifications ?? current.customNotifications ?? {},
      };
      await this.usersService.updateNotificationSettings(accountId, next);
      const persisted = await this.usersService.findOneById(accountId);
      return this.toNotificationPreferences(persisted?.notificationSettings ?? next);
    }

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
    if (this.usersService) {
      const user = await this.usersService.findOneById(accountId);
      if (!user) {
        throw new Error('User not found');
      }
      return this.toNotificationPreferences(user.notificationSettings ?? {} as any);
    }
    return this.ensureNotificationPreferences(accountId);
  }

  private toNotificationPreferences(settings: Record<string, any>): NotificationPreferences {
    return {
      emailDigest: settings.emailDigest ?? settings.emailNotifications ?? true,
      pushAlerts: settings.pushAlerts ?? true,
      smsAlerts: settings.smsAlerts ?? false,
      securityAlerts: settings.securityAlerts ?? true,
      notifyNewFollower: settings.notifyNewFollower ?? settings.newFollowers ?? true,
      notifyMentions: settings.notifyMentions ?? true,
      notifyMessages: settings.notifyMessages ?? settings.messages ?? true,
      notifyComments: settings.notifyComments ?? settings.comments ?? true,
      notifyLikes: settings.notifyLikes ?? settings.likes ?? true,
      customNotifications: settings.customNotifications ?? {},
      updatedAt: new Date().toISOString(),
    };
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
    const allowedDataPermissions = new Set<string>(Object.values(DataPermission));
    if (dataTypes.some((dataType) => !allowedDataPermissions.has(dataType))) {
      throw new Error('Invalid data permission category');
    }
    const settings = this.ensureSettings(accountId);
    settings.dataPermissions = Array.from(new Set(dataTypes));
    settings.updatedAt = new Date().toISOString();
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { accountDataPermissions: settings.dataPermissions });
    }
    this.recordHistory(accountId, 'settings', 'Updated data permissions', { dataTypes: settings.dataPermissions });

    return {
      accountId,
      dataPermissions: settings.dataPermissions,
      updatedAt: settings.updatedAt,
    };
  }

  async getDataPermissions(accountId: string): Promise<{ accountId: string; dataPermissions: string[]; updatedAt: string }> {
    const settings = this.ensureSettings(accountId);
    if (this.usersRepository) {
      const user = await this.usersRepository.findOne({ where: { id: accountId } });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.accountDataPermissions !== null && user.accountDataPermissions !== undefined) {
        settings.dataPermissions = Array.from(new Set(user.accountDataPermissions));
      }
    }
    return {
      accountId,
      dataPermissions: settings.dataPermissions,
      updatedAt: settings.updatedAt,
    };
  }

  async getAccountSecuritySettings(accountId: string): Promise<AccountSecurityFeatureSettings> {
    const settings = this.ensureAccountSecuritySettings(accountId);
    if (this.usersRepository) {
      const user = await this.usersRepository.findOne({ where: { id: accountId } });
      if (user?.accountSecuritySettings) {
        const persisted = user.accountSecuritySettings;
        const merged = {
          ...settings,
          ...persisted,
          accountId,
          updatedAt: persisted.updatedAt ?? settings.updatedAt,
        };
        this.accountSecuritySettings.set(accountId, merged);
        return merged;
      }
    }
    return settings;
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
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { accountSecuritySettings: next });
    }
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
    const memoryEntries = this.ensureHistory(accountId);
    if (!this.accountHistoryRepository) {
      return memoryEntries;
    }

    const persistedEntries = await this.accountHistoryRepository.find({
      where: { userId: accountId },
      order: { createdAt: 'DESC' },
    });
    const entriesById = new Map<string, AccountHistoryEntry>();

    for (const entry of persistedEntries) {
      entriesById.set(entry.id, {
        id: entry.id,
        type: entry.type as AccountHistoryEntry['type'],
        summary: entry.summary,
        occurredAt: entry.createdAt.toISOString(),
        metadata: entry.metadata,
      });
    }
    for (const entry of memoryEntries) {
      entriesById.set(entry.id, entry);
    }

    return Array.from(entriesById.values()).sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    );
  }

  async startAccountRecovery(accountId: string, method: 'email' | 'trusted_contact' | 'passkey' = 'email'): Promise<{ accountId: string; status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string }> {
    const createdAt = new Date().toISOString();
    const result = this.accountRecoveryRepository
      ? await this.accountRecoveryRepository.save(this.accountRecoveryRepository.create({ accountId, method, status: 'pending' }))
      : null;
    const recovery = { accountId, status: 'pending' as const, method, createdAt: result?.createdAt.toISOString() ?? createdAt };
    this.recoveryQueue.set(accountId, recovery);
    this.recordHistory(accountId, 'recovery', 'Account recovery started', { method });
    return recovery;
  }

  async completeAccountRecovery(accountId: string, approved = true): Promise<{ accountId: string; status: 'pending' | 'approved' | 'rejected'; method: string; createdAt: string }> {
    const persisted = this.accountRecoveryRepository
      ? await this.accountRecoveryRepository.findOne({ where: { accountId }, order: { createdAt: 'DESC' } })
      : null;
    const existing = persisted
      ? { accountId, status: persisted.status, method: persisted.method, createdAt: persisted.createdAt.toISOString() }
      : this.recoveryQueue.get(accountId) ?? {
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
    if (persisted && this.accountRecoveryRepository) {
      persisted.status = next.status as AccountRecoveryRequestStatus;
      persisted.completedAt = new Date();
      await this.accountRecoveryRepository.save(persisted);
    }
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
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, {
        showOnlineStatus: next.showOnlineStatus,
        readReceipts: next.readReceipts,
        mentions: next.mentions,
        activityVisibility: next.activityVisibility,
        storyVisibility: next.storyVisibility,
        searchVisibility: next.searchVisibility,
        contactDiscovery: next.contactDiscovery,
        personalization: next.personalization,
        adPersonalization: next.adPersonalization,
      });
    }
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
    const profiles = await this.loadAccountProfiles(accountId);
    const now = new Date().toISOString();
    const profileId = payload.id ?? (profiles.length === 0 ? `${accountId}-profile-primary` : `profile-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);

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
    if (profile.isPrimary || !nextProfiles.some((entry) => entry.isPrimary)) {
      for (const entry of nextProfiles) {
        entry.isPrimary = entry.id === profile.id;
      }
    }
    this.accountProfiles.set(accountId, nextProfiles);
    if (this.accountProfilesRepository) {
      await this.accountProfilesRepository.save(
        nextProfiles.map((entry) => this.accountProfileEntityFromModel(entry)),
      );
    }
    this.activeAccountProfileByAccount.set(accountId, profile.id);
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { activeAccountProfileId: profile.id });
    }
    this.recordHistory(accountId, 'settings', 'Account profile created', { profileId: profile.id, label: profile.label });
    return profile;
  }

  async listAccountProfiles(accountId: string): Promise<AccountProfile[]> {
    const profiles = await this.loadAccountProfiles(accountId);
    const activeProfileId = this.activeAccountProfileByAccount.get(accountId);
    return profiles
      .map((profile) => ({ ...profile, isCurrent: profile.id === activeProfileId }))
      .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || Number(b.isPrimary) - Number(a.isPrimary) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async switchAccountProfile(accountId: string, profileId: string): Promise<{ accountId: string; profileId: string; switched: boolean; message: string; profile: AccountProfile }> {
    const profiles = await this.loadAccountProfiles(accountId);
    if (profiles.length === 0) {
      const created = await this.createAccountProfile(accountId, { label: 'Primary', accountType: 'personal', isPrimary: true });
      this.activeAccountProfileByAccount.set(accountId, created.id);
      return {
        accountId,
        profileId: created.id,
        switched: true,
        message: 'Account profile switched successfully.',
        profile: created,
      };
    }

    const profile = profiles.find((entry) => entry.id === profileId) ?? null;
    if (!profile) {
      throw new Error(`Account profile ${profileId} was not found for account ${accountId}`);
    }

    this.accountProfiles.set(accountId, profiles);
    if (this.accountProfilesRepository) {
      await this.accountProfilesRepository.save(
        profiles.map((entry) => this.accountProfileEntityFromModel(entry)),
      );
    }
    this.activeAccountProfileByAccount.set(accountId, profile.id);
    if (this.usersRepository) {
      await this.usersRepository.update(accountId, { activeAccountProfileId: profile.id });
    }
    this.recordHistory(accountId, 'settings', 'Account profile switched', { profileId: profile.id, label: profile.label });

    return {
      accountId,
      profileId: profile.id,
      switched: true,
      message: 'Account profile switched successfully.',
      profile,
    };
  }

  async setPrimaryAccountProfile(accountId: string, profileId: string): Promise<AccountProfile | null> {
    const profiles = await this.loadAccountProfiles(accountId);
    const profile = profiles.find((entry) => entry.id === profileId);
    if (!profile) {
      return null;
    }

    for (const entry of profiles) {
      entry.isPrimary = entry.id === profileId;
      entry.updatedAt = new Date().toISOString();
    }

    this.accountProfiles.set(accountId, profiles);
    if (this.accountProfilesRepository) {
      await this.accountProfilesRepository.save(
        profiles.map((entry) => this.accountProfileEntityFromModel(entry)),
      );
    }
    this.activeAccountProfileByAccount.set(accountId, profileId);
    this.recordHistory(accountId, 'settings', 'Primary account profile updated', { profileId });
    return profile;
  }

  private async loadAccountProfiles(accountId: string): Promise<AccountProfile[]> {
    if (this.accountProfilesRepository) {
      const persisted = await this.accountProfilesRepository.find({ where: { accountId } });
      const profiles = persisted.map((entry) => this.accountProfileModelFromEntity(entry));
      this.accountProfiles.set(accountId, profiles);
      if (this.usersRepository) {
        const user = await this.usersRepository.findOne({ where: { id: accountId } });
        if (user?.activeAccountProfileId && profiles.some((profile) => profile.id === user.activeAccountProfileId)) {
          this.activeAccountProfileByAccount.set(accountId, user.activeAccountProfileId);
        }
      }
      return profiles;
    }
    return this.accountProfiles.get(accountId) ?? [];
  }

  private accountProfileEntityFromModel(model: AccountProfile): AccountProfileEntity {
    return this.accountProfilesRepository!.create({
      id: model.id,
      accountId: model.accountId,
      label: model.label,
      accountType: model.accountType as AccountProfileType,
      isPrimary: model.isPrimary,
      isActive: model.isActive,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    });
  }

  private accountProfileModelFromEntity(entity: AccountProfileEntity): AccountProfile {
    return {
      id: entity.id,
      accountId: entity.accountId,
      label: entity.label,
      accountType: entity.accountType,
      isPrimary: entity.isPrimary,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
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

    const identitySettings = await this.getIdentitySettings(accountId);
    const securitySettings = await this.getAccountSecuritySettings(accountId);
    const appeals = this.verificationAppeals.get(accountId) ?? [];
    const latestAppeal = appeals[0] ?? null;
    const hasLinkedAccount = (this.getLinkedAccounts(accountId)?.length ?? 0) > 0;

    const verified = latestAppeal?.status === 'approved' || identitySettings.ageVerified || identitySettings.enhancedSecurity;
    const badges: string[] = [];
    let trustScore = 0;

    if (verified) {
      badges.push('identity_verified');
      trustScore += 30;
    }

    const hasProfile = Boolean(identitySettings.displayName && identitySettings.displayName.trim()) && Boolean(identitySettings.bio && identitySettings.bio.trim());
    if (hasProfile) {
      badges.push('profile_complete');
      trustScore += 20;
    }

    if (securitySettings.twoFactorAuthentication) {
      badges.push('two_factor_enabled');
      trustScore += 20;
    }

    if (securitySettings.passkeysEnabled) {
      badges.push('passkey_ready');
      trustScore += 15;
    }

    if (securitySettings.securityCenterEnabled) {
      badges.push('security_center_active');
      trustScore += 10;
    }

    if (identitySettings.publicProfile) {
      badges.push('public_profile');
      trustScore += 5;
    }

    if (hasLinkedAccount) {
      badges.push('connected_account');
      trustScore += 5;
    }

    const normalized = Math.min(100, Math.max(0, trustScore));
    const next = {
      accountId,
      verified,
      badges: Array.from(new Set(badges)),
      trustScore: normalized,
      updatedAt: new Date().toISOString(),
    };

    this.trustIndicatorsMap.set(accountId, next);
    return next;
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
    if (this.loginSessionsRepository) {
      const loginSession = await this.loginSessionsRepository.save(
        this.loginSessionsRepository.create({
          user: { id: accountId } as User,
          deviceName,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          isTrusted: true,
          lastSeenAt: new Date(),
        }),
      );
      const session = this.accountSessionModelFromLoginEntity(loginSession, true);
      this.recordHistory(accountId, 'security', 'Account session created', { sessionId: session.id, deviceName, ipAddress });
      return session;
    }

    const sessions = this.accountSessionsRepository
      ? (await this.accountSessionsRepository.find({ where: { accountId } })).map((session) => this.accountSessionModelFromEntity(session))
      : (this.accountSessions.get(accountId) ?? []);
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
    if (this.accountSessionsRepository) {
      await this.accountSessionsRepository.save(this.accountSessionEntityFromModel(session));
    }
    this.recordHistory(accountId, 'security', 'Account session created', { sessionId: session.id, deviceName, ipAddress });
    return session;
  }

  async listAccountSessions(accountId: string): Promise<AccountSession[]> {
    if (this.loginSessionsRepository) {
      const sessions = await this.loginSessionsRepository.find({
        where: { user: { id: accountId } },
        order: { createdAt: 'DESC' },
      });
      return sessions.map((session) => this.accountSessionModelFromLoginEntity(session));
    }

    if (this.accountSessionsRepository) {
      const sessions = await this.accountSessionsRepository.find({ where: { accountId }, order: { createdAt: 'DESC' } });
      const models = sessions.map((session) => this.accountSessionModelFromEntity(session));
      this.accountSessions.set(accountId, models);
      return models;
    }
    return this.accountSessions.get(accountId) ?? [];
  }

  async revokeAccountSession(accountId: string, sessionId: string): Promise<{ accountId: string; sessionId: string; revoked: boolean; message: string }> {
    if (this.loginSessionsRepository) {
      const session = await this.loginSessionsRepository.findOne({
        where: { id: sessionId, user: { id: accountId } },
      });
      if (!session) {
        return { accountId, sessionId, revoked: false, message: 'Session not found.' };
      }

      if (!session.revokedAt) {
        session.revokedAt = new Date();
        await this.loginSessionsRepository.save(session);
        this.recordHistory(accountId, 'security', 'Account session revoked', { sessionId });
      }
      return { accountId, sessionId, revoked: true, message: 'Session revoked successfully.' };
    }

    const sessions = await this.listAccountSessions(accountId);
    const target = sessions.find((entry) => entry.id === sessionId);
    if (!target) {
      return { accountId, sessionId, revoked: false, message: 'Session not found.' };
    }

    target.status = 'revoked';
    target.lastSeenAt = new Date().toISOString();
    if (this.accountSessionsRepository) {
      await this.accountSessionsRepository.update({ id: sessionId, accountId }, { status: 'revoked', lastSeenAt: new Date() });
    }
    this.accountSessions.set(accountId, sessions);
    this.recordHistory(accountId, 'security', 'Account session revoked', { sessionId });
    return { accountId, sessionId, revoked: true, message: 'Session revoked successfully.' };
  }

  async revokeAllOtherSessions(accountId: string, currentSessionId?: string): Promise<{ accountId: string; revoked: boolean; message: string }> {
    if (this.loginSessionsRepository) {
      const sessions = await this.loginSessionsRepository.find({
        where: { user: { id: accountId } },
      });
      const activeOtherSessions = sessions.filter((session) => session.id !== currentSessionId && !session.revokedAt);
      if (activeOtherSessions.length > 0) {
        const revokedAt = new Date();
        await this.loginSessionsRepository
          .createQueryBuilder()
          .update(LoginSession)
          .set({ revokedAt })
          .where('userId = :accountId', { accountId })
          .andWhere('revokedAt IS NULL')
          .andWhere(currentSessionId ? 'id != :currentSessionId' : '1 = 1', { currentSessionId })
          .execute();
      }
      this.recordHistory(accountId, 'security', 'Other account sessions revoked', { currentSessionId });
      return { accountId, revoked: true, message: 'Other sessions revoked successfully.' };
    }

    const sessions = await this.listAccountSessions(accountId);
    const updated = sessions.map((session) => {
      const shouldRevoke = session.id !== currentSessionId && session.status !== 'revoked';
      if (shouldRevoke) {
        session.status = 'revoked';
        session.lastSeenAt = new Date().toISOString();
      }
      return session;
    });

    this.accountSessions.set(accountId, updated);
    if (this.accountSessionsRepository) {
      await this.accountSessionsRepository
        .createQueryBuilder()
        .update(AccountSessionEntity)
        .set({ status: 'revoked', lastSeenAt: new Date() })
        .where('accountId = :accountId', { accountId })
        .andWhere('status != :status', { status: 'revoked' })
        .andWhere(currentSessionId ? 'id != :currentSessionId' : '1 = 1', { currentSessionId })
        .execute();
    }
    this.recordHistory(accountId, 'security', 'Other account sessions revoked', { currentSessionId });

    return { accountId, revoked: true, message: 'Other sessions revoked successfully.' };
  }

  private accountSessionEntityFromModel(model: AccountSession): AccountSessionEntity {
    return this.accountSessionsRepository!.create({
      id: model.id,
      accountId: model.accountId,
      deviceName: model.deviceName,
      ipAddress: model.ipAddress,
      userAgent: model.userAgent,
      isCurrent: model.isCurrent,
      status: model.status,
      createdAt: new Date(model.createdAt),
      lastSeenAt: new Date(model.lastSeenAt),
    });
  }

  private accountSessionModelFromEntity(entity: AccountSessionEntity): AccountSession {
    return {
      id: entity.id,
      accountId: entity.accountId,
      deviceName: entity.deviceName,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      isCurrent: entity.isCurrent,
      createdAt: entity.createdAt.toISOString(),
      lastSeenAt: entity.lastSeenAt.toISOString(),
      status: entity.status,
    };
  }

  private accountSessionModelFromLoginEntity(entity: LoginSession, isCurrent = false): AccountSession {
    return {
      id: entity.id,
      accountId: entity.user.id,
      deviceName: entity.deviceName ?? 'Unknown device',
      ipAddress: entity.ipAddress ?? undefined,
      userAgent: entity.userAgent ?? undefined,
      isCurrent,
      createdAt: entity.createdAt.toISOString(),
      lastSeenAt: (entity.lastSeenAt ?? entity.createdAt).toISOString(),
      status: entity.revokedAt ? 'revoked' : 'active',
    };
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

    if (this.accountDeletionRepository) {
      await this.accountDeletionRepository.delete({ accountId, status: 'pending' });
      await this.accountDeletionRepository.save(this.accountDeletionRepository.create({
        accountId,
        reason: request.reason,
        additionalInfo: request.additionalInfo,
        deleteLinkedAccounts: request.deleteLinkedAccounts,
        deleteAllData: request.deleteAllData,
        status: 'pending',
      }));
    } else {
      this.accountDeletionRequests.set(accountId, request);
    }
    this.recordHistory(accountId, 'security', 'Account deletion requested', {
      reason: request.reason,
      deleteLinkedAccounts: request.deleteLinkedAccounts,
      deleteAllData: request.deleteAllData,
      requestId: request.id,
    });

    const settings = this.ensureSettings(accountId);
    settings.deactivated = true;
    settings.updatedAt = new Date().toISOString();
    if (this.usersService?.deactivate) {
      await this.usersService.deactivate(accountId, 'Account deletion requested');
    }

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
    const persisted = this.accountDeletionRepository
      ? await this.accountDeletionRepository.findOne({ where: { accountId, status: 'pending' }, order: { createdAt: 'DESC' } })
      : null;
    const memoryRequest = this.accountDeletionRequests.get(accountId);
    const existing = persisted ?? memoryRequest;
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

    if (persisted && this.accountDeletionRepository) {
      persisted.status = 'deleted';
      persisted.processedAt = new Date(deletedAt);
      await this.accountDeletionRepository.save(persisted);
    } else if (memoryRequest) {
      this.accountDeletionRequests.set(accountId, {
        ...memoryRequest,
        status: 'deleted',
        processedAt: deletedAt,
      });
    }
    this.recordHistory(accountId, 'security', 'Account deleted permanently', {
      requestId: existing.id,
      deletedAt,
      deleteLinkedAccounts: existing.deleteLinkedAccounts,
      deleteAllData: existing.deleteAllData,
    });

    if (this.usersService) {
      await this.usersService.delete(accountId);
    }

    return {
      accountId,
      status: 'deleted',
      message: 'Account deleted successfully and all associated data was removed.',
      deletedAt,
    };
  }

  private toSecurityAlert(alert: SecurityAlertEntity): SecurityAlert {
    return {
      id: alert.id,
      accountId: alert.userId,
      type: alert.type as SecurityAlert['type'],
      message: alert.message,
      severity: alert.severity as SecurityAlert['severity'],
      createdAt: alert.createdAt.toISOString(),
      resolved: alert.resolved,
      metadata: alert.metadata,
    };
  }

  async recordSecurityAlert(
    accountId: string,
    type: SecurityAlert['type'],
    message: string,
    severity: SecurityAlert['severity'] = 'medium',
    metadata: Record<string, any> = {},
  ): Promise<SecurityAlert> {
    if (this.securityAlertsRepository) {
      const saved = await this.securityAlertsRepository.save(
        this.securityAlertsRepository.create({
          userId: accountId,
          type,
          message,
          severity,
          resolved: false,
          metadata,
        }),
      );
      this.recordHistory(accountId, 'security', `Security alert: ${message}`, { type, severity, metadata });
      return this.toSecurityAlert(saved);
    }

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
    if (this.securityAlertsRepository) {
      const alert = await this.securityAlertsRepository.findOne({ where: { id: alertId, userId: accountId } });
      if (!alert) {
        return null;
      }
      alert.resolved = resolved;
      const saved = await this.securityAlertsRepository.save(alert);
      this.recordHistory(accountId, 'security', resolved ? 'Security alert resolved' : 'Security alert reopened', { alertId });
      return this.toSecurityAlert(saved);
    }

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
    const [history, privacy, securityCenter, preferences, notifications, persistedUser, persistedLinkedAccounts] = await Promise.all([
      this.getAccountHistory(accountId),
      this.getPrivacySettings(accountId),
      this.getSecurityCenter(accountId),
      this.getAccountPreferences(accountId),
      this.getNotificationPreferences(accountId),
      this.getPersistedUser(accountId),
      this.getPersistedLinkedAccounts(accountId),
    ]);

    const persistedRecovery = this.accountRecoveryRepository
      ? await this.accountRecoveryRepository.findOne({ where: { accountId }, order: { createdAt: 'DESC' } })
      : null;
    const recoveryStatus = persistedRecovery
      ? { accountId, status: persistedRecovery.status, method: persistedRecovery.method, createdAt: persistedRecovery.createdAt.toISOString() }
      : this.recoveryQueue.get(accountId);
    const mappedLinkedAccounts = persistedLinkedAccounts.length > 0
      ? persistedLinkedAccounts.map((entry) => ({
          id: entry.id,
          provider: entry.provider,
          externalUserId: entry.externalUserId,
          displayName: entry.displayName ?? undefined,
          email: entry.email ?? undefined,
          connectedAt: entry.connectedAt ? new Date(entry.connectedAt).toISOString() : new Date().toISOString(),
          isPrimary: entry.isPrimary,
        }))
      : this.getLinkedAccounts(accountId);

    const account = persistedUser
      ? {
          accountId,
          deactivated: Boolean(persistedUser.status === 'deactivated' || persistedUser.banned),
          status: persistedUser.status ?? 'active',
          switchingEnabled: true,
          permissions: persistedUser.accountPermissions ?? this.ensureSettings(accountId).permissions,
          personalizationSettings: {},
          dataPermissions: ['profile', 'posts', 'settings'],
          updatedAt: new Date().toISOString(),
        }
      : this.ensureSettings(accountId);

    const persistedPrivacy = persistedUser
      ? {
          showOnlineStatus: typeof persistedUser.showOnlineStatus === 'boolean' ? persistedUser.showOnlineStatus : privacy.showOnlineStatus,
          readReceipts: typeof persistedUser.readReceipts === 'boolean' ? persistedUser.readReceipts : privacy.readReceipts,
          mentions: (persistedUser.mentions as PrivacySettingsSnapshot['mentions']) ?? privacy.mentions,
          activityVisibility: (persistedUser.activityVisibility as PrivacySettingsSnapshot['activityVisibility']) ?? privacy.activityVisibility,
          storyVisibility: (persistedUser.storyVisibility as PrivacySettingsSnapshot['storyVisibility']) ?? privacy.storyVisibility,
          searchVisibility: (persistedUser.searchVisibility as PrivacySettingsSnapshot['searchVisibility']) ?? privacy.searchVisibility,
          contactDiscovery: typeof persistedUser.contactDiscovery === 'boolean' ? persistedUser.contactDiscovery : privacy.contactDiscovery,
          personalization: typeof persistedUser.personalization === 'boolean' ? persistedUser.personalization : privacy.personalization,
          adPersonalization: typeof persistedUser.adPersonalization === 'boolean' ? persistedUser.adPersonalization : privacy.adPersonalization,
          updatedAt: privacy.updatedAt,
        }
      : privacy;

    const persistedPreferences = persistedUser
      ? {
          ...preferences,
          theme: ((persistedUser as any).profileTheme ?? preferences.theme ?? 'system') as AccountPreferences['theme'],
          language: (persistedUser as any).language ?? preferences.language,
          timezone: (persistedUser as any).timezone ?? preferences.timezone,
        }
      : preferences;

    const persistedNotifications = persistedUser?.notificationSettings
      ? this.toNotificationPreferences(persistedUser.notificationSettings)
      : notifications;

    return {
      account,
      preferences: persistedPreferences,
      notifications: persistedNotifications,
      linkedAccounts: mappedLinkedAccounts,
      history,
      privacy: persistedPrivacy,
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
    const fallbackLogs = this.ensureHistory(accountId).slice(0, 25).map((entry) => ({
      id: entry.id,
      message: entry.summary,
      timestamp: entry.occurredAt,
      type: entry.type,
    }));

    let logs = fallbackLogs;
    if (this.securityAuditService) {
      try {
        const persisted = await this.securityAuditService.getUserAuditLog(accountId, { take: 25, skip: 0 });
        logs = persisted.logs.map((entry) => ({
          id: entry.id,
          message: entry.message,
          timestamp: entry.createdAt.toISOString(),
          type: 'security' as const,
        }));
      } catch {
        logs = fallbackLogs;
      }
    }

    const [connectedAccounts, trustedDevices, storedAlerts] = await Promise.all([
      Promise.resolve(this.getLinkedAccounts(accountId)),
      this.getTrustedDevices(accountId),
      this.securityAlertsRepository
        ? this.securityAlertsRepository.find({ where: { userId: accountId }, order: { createdAt: 'DESC' }, take: 50 })
        : Promise.resolve(null),
    ]);

    return {
      accountId,
      exportUrl: `/security-log/${accountId}.json`,
      logs,
      connectedAccounts,
      trustedDevices,
      recoveryStatus: this.recoveryQueue.get(accountId) ?? null,
      pendingAppeals: (this.verificationAppeals.get(accountId) ?? []).filter((entry) => entry.status === 'pending'),
      securityAlerts: storedAlerts
        ? storedAlerts.map((alert) => this.toSecurityAlert(alert))
        : this.securityAlerts.get(accountId) ?? [],
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
