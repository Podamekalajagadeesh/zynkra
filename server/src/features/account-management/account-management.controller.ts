import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AccountManagementService } from './account-management.service';
import { AccountLinkingService } from './account-linking.service';
import { LoginApprovalService } from './login-approval.service';
import { IdentitySettingsService } from './identity-settings.service';
import { TrustIndicatorService } from './trust-indicator.service';
import { AdPreferencesService } from './ad-preferences.service';
import { SecuritySettingsService } from './security-settings.service';
import { LinkAccountDto, UnlinkAccountDto, SetPrimaryAccountDto } from './dto/link-account.dto';
import { CreateIdentitySettingsDto, UpdateIdentitySettingsDto } from './dto/identity-settings.dto';
import { ApproveLoginRequestDto, RejectLoginRequestDto } from './dto/login-approval.dto';
import { UpdateAccountPreferencesDto } from './dto/account-preferences.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { UpdatePrivacySettingsDto } from './dto/privacy-settings.dto';
import { UpdateAdPreferencesDto } from './dto/ad-preferences.dto';
import { CreateAccountSessionDto, RevokeSessionDto } from './dto/account-session.dto';
import { RequestAccountDeletionDto, ConfirmAccountDeletionDto } from './dto/account-deletion.dto';
import { RequestDataDownloadDto, RequestDataDeletionDto } from './dto/data-management.dto';
import { UpdateSecuritySettingsDto } from './dto/security-settings.dto';
import { UpdateAccountPermissionsDto } from './dto/account-permissions.dto';
import { UpdateDataPermissionsDto } from './dto/data-permissions.dto';
import { LinkedAccountProvider } from './entities/linked-account.entity';
import { DataExportService } from '../../data-export/data-export.service';
import { ExportData, ExportService } from '../../data-export/export.service';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountManagementController {
  constructor(
    private readonly accountManagementService: AccountManagementService,
    private readonly accountLinkingService: AccountLinkingService,
    private readonly loginApprovalService: LoginApprovalService,
    private readonly identitySettingsService: IdentitySettingsService,
    private readonly trustIndicatorService: TrustIndicatorService,
    private readonly adPreferencesService: AdPreferencesService,
    private readonly dataExportService: DataExportService,
    private readonly exportService: ExportService,
    private readonly securitySettingsService: SecuritySettingsService,
  ) {}

  // ============ ACCOUNT DASHBOARD ============

  @Get('dashboard')
  async getAccountDashboard(@Request() req) {
    return this.accountManagementService.getAccountDashboard(req.user.userId);
  }

  // ============ ACCOUNT PREFERENCES ============

  @Get('preferences')
  async getAccountPreferences(@Request() req) {
    return this.accountManagementService.getAccountPreferences(req.user.userId);
  }

  @Put('preferences')
  async updateAccountPreferences(@Request() req, @Body() dto: UpdateAccountPreferencesDto) {
    return this.accountManagementService.updateAccountPreferences(req.user.userId, dto);
  }

  // ============ ACCOUNT PERMISSIONS ============

  @Get('permissions')
  async getAccountPermissions(@Request() req) {
    return this.accountManagementService.getPermissions(req.user.userId);
  }

  @Put('permissions')
  async updateAccountPermissions(@Request() req, @Body() dto: UpdateAccountPermissionsDto) {
    return this.accountManagementService.updatePermissions(req.user.userId, dto.permissions);
  }

  @Get('data-permissions')
  async getDataPermissions(@Request() req) {
    return this.accountManagementService.getDataPermissions(req.user.userId);
  }

  @Put('data-permissions')
  async updateDataPermissions(@Request() req, @Body() dto: UpdateDataPermissionsDto) {
    return this.accountManagementService.updateDataPermissions(req.user.userId, dto.dataPermissions);
  }

  // ============ NOTIFICATION PREFERENCES ============

  @Get('notifications/preferences')
  async getNotificationPreferences(@Request() req) {
    return this.accountManagementService.getNotificationPreferences(req.user.userId);
  }

  @Put('notifications/preferences')
  async updateNotificationPreferences(@Request() req, @Body() dto: UpdateNotificationPreferencesDto) {
    return this.accountManagementService.updateNotificationPreferences(req.user.userId, dto);
  }

  // ============ PRIVACY SETTINGS ============

  @Get('privacy')
  async getPrivacySettings(@Request() req) {
    return this.accountManagementService.getPrivacySettings(req.user.userId);
  }

  @Put('privacy')
  async updatePrivacySettings(@Request() req, @Body() dto: UpdatePrivacySettingsDto) {
    return this.accountManagementService.updatePrivacySettings(req.user.userId, dto);
  }

  // ============ AD PREFERENCES ============

  @Get('ad-preferences')
  async getAdPreferences(@Request() req) {
    return this.adPreferencesService.getAdPreferences(req.user.userId);
  }

  @Put('ad-preferences')
  async updateAdPreferences(@Request() req, @Body() dto: UpdateAdPreferencesDto) {
    return this.adPreferencesService.updateAdPreferences(req.user.userId, dto);
  }

  @Post('ad-preferences/block-advertiser')
  async blockAdvertiser(@Request() req, @Body() body: { advertiserId: string }) {
    return this.adPreferencesService.blockAdvertiser(req.user.userId, body.advertiserId);
  }

  @Post('ad-preferences/unblock-advertiser')
  async unblockAdvertiser(@Request() req, @Body() body: { advertiserId: string }) {
    return this.adPreferencesService.unblockAdvertiser(req.user.userId, body.advertiserId);
  }

  @Get('ad-preferences/blocked-advertisers')
  async getBlockedAdvertisers(@Request() req) {
    const blockedAdvertisers = await this.adPreferencesService.getBlockedAdvertisers(req.user.userId);
    return { blockedAdvertisers };
  }

  @Post('ad-preferences/targeting-level')
  async setAdTargetingLevel(@Request() req, @Body() body: { level: 'disabled' | 'basic' | 'personalized' | 'advanced' }) {
    return this.adPreferencesService.setAdTargetingLevel(req.user.userId, body.level);
  }

  @Post('ad-preferences/reset')
  async resetAdPreferences(@Request() req) {
    const result = await this.adPreferencesService.resetAdPreferences(req.user.userId);
    return { success: true, preferences: result };
  }

  // ============ ACCOUNT SESSIONS ============

  @Get('sessions')
  async listAccountSessions(@Request() req) {
    return this.accountManagementService.listAccountSessions(req.user.userId);
  }

  @Post('sessions')
  async createAccountSession(@Request() req, @Body() dto: CreateAccountSessionDto) {
    return this.accountManagementService.createAccountSession(req.user.userId, dto.deviceName, dto.ipAddress, dto.userAgent);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAccountSession(@Request() req, @Param('sessionId') sessionId: string, @Body() dto: RevokeSessionDto) {
    await this.accountManagementService.revokeAccountSession(req.user.userId, sessionId);
  }

  @Post('sessions/revoke-all-others')
  async revokeAllOtherSessions(@Request() req) {
    return this.accountManagementService.revokeAllOtherSessions(req.user.userId, req.user.sessionId ?? undefined);
  }

  // ============ DATA MANAGEMENT ============

  @Post('data/download')
  async requestDataDownload(@Request() req, @Body() dto: RequestDataDownloadDto) {
    return this.accountManagementService.requestDataDownload(req.user.userId, dto.dataTypes || []);
  }

  @Post('data/export')
  async exportAccountData(@Request() req, @Body() body: { dataTypes?: string[]; format?: string; includeSecurityLog?: boolean; includeLinkedAccounts?: boolean; includePrivacySettings?: boolean; includeHistory?: boolean }) {
    if (body.format && body.format !== 'json') {
      throw new BadRequestException('Account export currently supports JSON format only');
    }
    const accountId = req.user.userId || req.user.id;
    const exportRequest = await this.dataExportService.create(req.user);
    return {
      accountId,
      status: exportRequest.status,
      format: 'json',
      generatedAt: exportRequest.createdAt.toISOString(),
      fileUrl: exportRequest.fileUrl,
      includes: {
        profile: true,
        content: true,
        socialGraph: true,
        messages: true,
        commerce: true,
        settings: true,
        securityLog: !!body.includeSecurityLog,
        linkedAccounts: !!body.includeLinkedAccounts,
        privacySettings: !!body.includePrivacySettings,
        history: !!body.includeHistory,
      },
    };
  }

  @Post('data/delete')
  async requestDataDeletion(@Request() req, @Body() dto: RequestDataDeletionDto) {
    return this.accountManagementService.requestDataDeletion(req.user.userId, dto.dataTypes, dto.reason);
  }

  @Post('data/import')
  async importAccountData(@Request() req, @Body() body: ExportData) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || !body.user) {
      throw new BadRequestException('Invalid export data: missing user object');
    }

    return this.exportService.importFromJson(req.user.userId, body);
  }

  // ============ ACCOUNT DELETION ============

  @Post('delete/request')
  async requestAccountDeletion(@Request() req, @Body() dto: RequestAccountDeletionDto) {
    return this.accountManagementService.requestAccountDeletion(req.user.userId, {
      reason: dto.reason,
      additionalInfo: dto.additionalInfo,
      deleteLinkedAccounts: dto.deleteLinkedAccounts ?? true,
      deleteAllData: dto.deleteAllData ?? true,
    });
  }

  @Post('delete/confirm')
  async confirmAccountDeletion(@Request() req, @Body() dto: ConfirmAccountDeletionDto) {
    return this.accountManagementService.confirmAccountDeletion(req.user.userId, dto.confirmationCode);
  }

  // ============ ACCOUNT HISTORY ============

  @Get('history')
  async getAccountHistory(@Request() req) {
    return this.accountManagementService.getAccountHistory(req.user.userId);
  }

  @Get('security-log')
  async exportSecurityLog(@Request() req) {
    return this.accountManagementService.exportSecurityLog(req.user.userId);
  }

  @Get('security-alerts')
  async getSecurityAlerts(@Request() req) {
    const center = await this.accountManagementService.getSecurityCenter(req.user.userId);
    return center.securityAlerts;
  }

  @Post('security-alerts/:alertId/resolve')
  async resolveSecurityAlert(@Request() req, @Param('alertId') alertId: string) {
    const alert = await this.accountManagementService.resolveSecurityAlert(req.user.userId, alertId, true);
    if (!alert) {
      throw new BadRequestException('Security alert not found');
    }
    return alert;
  }

  @Post('security-alerts/:alertId/reopen')
  async reopenSecurityAlert(@Request() req, @Param('alertId') alertId: string) {
    const alert = await this.accountManagementService.resolveSecurityAlert(req.user.userId, alertId, false);
    if (!alert) {
      throw new BadRequestException('Security alert not found');
    }
    return alert;
  }

  // ============ LINKED ACCOUNTS ============

  @Get('linked-accounts')
  async getLinkedAccounts(@Request() req) {
    return this.accountLinkingService.getUserLinkedAccounts(req.user.userId);
  }

  @Post('linked-accounts/oauth/:provider')
  async startLinkedAccountOAuth(@Request() req, @Param('provider') provider: LinkedAccountProvider) {
    if (!Object.values(LinkedAccountProvider).includes(provider)) {
      throw new BadRequestException('Unsupported linked-account provider');
    }
    const state = this.accountLinkingService.createOAuthState(req.user.userId, provider);
    return { authorizationUrl: this.accountLinkingService.getOAuthStartUrl(provider, state) };
  }

  @Post('linked-accounts')
  async linkAccount(@Request() req, @Body() linkAccountDto: LinkAccountDto) {
    return this.accountLinkingService.linkAccount(req.user.userId, linkAccountDto);
  }

  @Get('linked-accounts/:accountId')
  async getLinkedAccount(@Request() req, @Param('accountId') accountId: string) {
    const account = await this.accountLinkingService.getLinkedAccount(accountId);
    if (account.userId !== req.user.userId) {
      throw new BadRequestException('You do not have permission to view this account');
    }
    return account;
  }

  @Delete('linked-accounts/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkAccount(@Request() req, @Param('accountId') accountId: string) {
    await this.accountLinkingService.unlinkAccount(req.user.userId, accountId);
  }

  @Put('linked-accounts/:accountId/primary')
  async setPrimaryAccount(@Request() req, @Param('accountId') accountId: string) {
    return this.accountLinkingService.setPrimaryAccount(req.user.userId, accountId);
  }

  @Get('linked-accounts/:accountId/primary')
  async getPrimaryAccount(@Request() req) {
    return this.accountLinkingService.getPrimaryLinkedAccount(req.user.userId);
  }

  // ============ LOGIN APPROVALS ============

  @Get('login-approvals')
  async getLoginApprovals(@Request() req) {
    return this.loginApprovalService.getUserPendingApprovals(req.user.userId);
  }

  @Get('login-approvals/history')
  async getApprovalHistory(@Request() req, @Body() body: { limit?: number; offset?: number }) {
    const [approvals, total] = await this.loginApprovalService.getUserApprovalHistory(
      req.user.userId,
      body.limit || 50,
      body.offset || 0,
    );
    return { approvals, total };
  }

  @Get('login-approvals/:approvalId')
  async getApprovalRequest(@Request() req, @Param('approvalId') approvalId: string) {
    const approval = await this.loginApprovalService.getApprovalRequest(approvalId);
    if (approval.userId !== req.user.userId) {
      throw new BadRequestException('You do not have permission to view this approval');
    }
    return approval;
  }

  @Post('login-approvals/:approvalId/approve')
  async approveLogin(@Request() req, @Param('approvalId') approvalId: string, @Body() approveDto: ApproveLoginRequestDto) {
    return this.loginApprovalService.approveLoginRequest(approvalId, req.user.userId, approveDto);
  }

  @Post('login-approvals/:approvalId/reject')
  async rejectLogin(@Request() req, @Param('approvalId') approvalId: string, @Body() rejectDto: RejectLoginRequestDto) {
    return this.loginApprovalService.rejectLoginRequest(approvalId, req.user.userId, rejectDto);
  }

  @Post('login-approvals/:approvalId/remember-device')
  async rememberDevice(@Request() req, @Param('approvalId') approvalId: string) {
    return this.loginApprovalService.rememberDevice(approvalId, req.user.userId);
  }

  @Get('login-approvals/stats')
  async getLoginApprovalStats(@Request() req) {
    return this.loginApprovalService.getLoginApprovalStats(req.user.userId);
  }

  // ============ IDENTITY SETTINGS ============

  @Get('identity-settings')
  async getIdentitySettings(@Request() req) {
    return this.identitySettingsService.getIdentitySettings(req.user.userId);
  }

  @Post('identity-settings')
  async createIdentitySettings(@Request() req, @Body() createDto: CreateIdentitySettingsDto) {
    return this.identitySettingsService.createIdentitySettings(req.user.userId, createDto);
  }

  @Put('identity-settings')
  async updateIdentitySettings(@Request() req, @Body() updateDto: UpdateIdentitySettingsDto) {
    return this.identitySettingsService.updateIdentitySettings(req.user.userId, updateDto);
  }

  @Post('identity-settings/creator-mode/enable')
  async enableCreatorMode(@Request() req) {
    return this.identitySettingsService.enableCreatorMode(req.user.userId);
  }

  @Post('identity-settings/creator-mode/disable')
  async disableCreatorMode(@Request() req) {
    return this.identitySettingsService.disableCreatorMode(req.user.userId);
  }

  @Post('identity-settings/business-mode/enable')
  async enableBusinessMode(@Request() req) {
    return this.identitySettingsService.enableBusinessMode(req.user.userId);
  }

  @Post('identity-settings/business-mode/disable')
  async disableBusinessMode(@Request() req) {
    return this.identitySettingsService.disableBusinessMode(req.user.userId);
  }

  @Post('identity-settings/public-profile/:isPublic')
  async setPublicProfile(@Request() req, @Param('isPublic') isPublic: string) {
    return this.identitySettingsService.setPublicProfile(req.user.userId, isPublic === 'true');
  }

  @Post('identity-settings/enhanced-security/enable')
  async enableEnhancedSecurity(@Request() req) {
    return this.identitySettingsService.enableEnhancedSecurity(req.user.userId);
  }

  @Post('identity-settings/enhanced-security/disable')
  async disableEnhancedSecurity(@Request() req) {
    return this.identitySettingsService.disableEnhancedSecurity(req.user.userId);
  }

  @Get('identity-settings/verification-status')
  async getVerificationStatus(@Request() req) {
    return this.identitySettingsService.getIdentityVerificationStatus(req.user.userId);
  }

  // ============ TRUST INDICATORS ============

  @Get('trust-indicator')
  async getTrustIndicator(@Request() req) {
    return this.trustIndicatorService.getTrustIndicator(req.user.userId);
  }

  @Get('trust-indicator/score')
  async getTrustScore(@Request() req) {
    const score = await this.trustIndicatorService.getTrustScore(req.user.userId);
    return { trustScore: score };
  }

  @Get('trust-indicator/level')
  async getTrustLevel(@Request() req) {
    const level = await this.trustIndicatorService.getTrustLevel(req.user.userId);
    return { trustLevel: level };
  }

  @Post('trust-indicator/update')
  async updateTrustIndicator(@Request() req) {
    return this.trustIndicatorService.updateTrustScore(req.user.userId);
  }

  @Get('trust-indicator/stats')
  async getTrustStats() {
    return this.trustIndicatorService.getTrustStats();
  }

  // ============ SECURITY SETTINGS ============

  @Get('security')
  async getSecuritySettings(@Request() req) {
    return this.securitySettingsService.getSecuritySettings(req.user.userId);
  }

  @Put('security')
  async updateSecuritySettings(@Request() req, @Body() dto: UpdateSecuritySettingsDto) {
    return this.securitySettingsService.updateSecuritySettings(req.user.userId, dto, req.user.userId);
  }

  @Get('security/features')
  async getAccountSecurityFeatures(@Request() req) {
    return this.accountManagementService.getAccountSecuritySettings(req.user.userId);
  }

  @Put('security/features')
  async updateAccountSecurityFeatures(@Request() req, @Body() dto: Partial<UpdateSecuritySettingsDto>) {
    return this.accountManagementService.updateAccountSecuritySettings(req.user.userId, {
      twoFactorAuthentication: dto.twoFactorAuthentication ?? undefined,
      biometricAuthentication: dto.biometricAuthentication ?? undefined,
      passkeysEnabled: dto.passkeysEnabled ?? undefined,
      recoveryCodesEnabled: dto.recoveryCodesEnabled ?? undefined,
      loginApprovalsEnabled: dto.loginApprovalsEnabled ?? undefined,
      suspiciousLoginAlertsEnabled: dto.suspiciousLoginAlertsEnabled ?? undefined,
      deviceManagementEnabled: dto.deviceManagementEnabled ?? undefined,
      sessionManagementEnabled: dto.sessionManagementEnabled ?? undefined,
      accountRecoveryEnabled: dto.accountRecoveryEnabled ?? undefined,
      securityCenterEnabled: dto.securityCenterEnabled ?? undefined,
    });
  }

  @Get('security/summary')
  async getAccountSecuritySummary(@Request() req) {
    return this.accountManagementService.getAccountSecuritySummary(req.user.userId);
  }

  @Post('security/2fa/enable')
  async enableTwoFA(@Request() req) {
    return this.securitySettingsService.enableTwoFA(req.user.userId);
  }

  @Post('security/2fa/disable')
  async disableTwoFA(@Request() req) {
    return this.securitySettingsService.disableTwoFA(req.user.userId);
  }

  @Post('security/biometric/enable')
  async enableBiometric(@Request() req) {
    return this.securitySettingsService.enableBiometricAuth(req.user.userId);
  }

  @Post('security/trusted-ips')
  async addTrustedIp(@Request() req, @Body() body: { ipAddress: string }) {
    return this.securitySettingsService.addTrustedIpAddress(req.user.userId, body.ipAddress);
  }

  @Delete('security/trusted-ips/:ipAddress')
  async removeTrustedIp(@Request() req, @Param('ipAddress') ipAddress: string) {
    return this.securitySettingsService.removeTrustedIpAddress(req.user.userId, ipAddress);
  }

  @Get('security/audit-log')
  async getSecurityAuditLog(@Request() req, @Body() body: { limit?: number }) {
    return this.securitySettingsService.getSecurityAuditLog(req.user.userId, body?.limit || 100);
  }

  @Post('security/audit-log/clear')
  async clearAuditLogs(@Request() req, @Body() body: { olderThanDays: number }) {
    return this.securitySettingsService.clearOldAuditLogs(req.user.userId, body.olderThanDays);
  }

  @Get('security/audit-log/export')
  async exportAuditLog(@Request() req) {
    return this.securitySettingsService.exportAuditLog(req.user.userId);
  }

  @Post('security/level')
  async setSecurityLevel(@Request() req, @Body() body: { level: 'standard' | 'enhanced' | 'maximum' }) {
    return this.securitySettingsService.setSecurityLevel(req.user.userId, body.level);
  }

  @Get('security/risk-assessment')
  async getSecurityRiskAssessment(@Request() req) {
    return this.securitySettingsService.getSecurityRiskAssessment(req.user.userId);
  }
}
