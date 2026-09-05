import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountManagementService } from './account-management.service';
import { AccountManagementController } from './account-management.controller';
import { AccountLinkingService } from './account-linking.service';
import { LoginApprovalService } from './login-approval.service';
import { IdentitySettingsService } from './identity-settings.service';
import { TrustIndicatorService } from './trust-indicator.service';
import { AdPreferencesService } from './ad-preferences.service';
import { SecuritySettingsService } from './security-settings.service';
import { LinkedAccount } from './entities/linked-account.entity';
import { AccountProfileEntity } from './entities/account-profile.entity';
import { LoginApproval } from './entities/login-approval.entity';
import { IdentitySettings } from './entities/identity-settings.entity';
import { TrustIndicator } from './entities/trust-indicator.entity';
import { SecurityAlertEntity } from './entities/security-alert.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import { SecurityAuditModule } from '../../security-audit/security-audit.module';
import { AccountDeletionRequest } from './entities/account-deletion-request.entity';
import { AccountHistoryEntity } from './entities/account-history.entity';
import { AccountSessionEntity } from './entities/account-session.entity';
import { AccountRecoveryRequest } from './entities/account-recovery-request.entity';
import { UsersModule } from '../../users/users.module';
import { DataExportModule } from '../../data-export/data-export.module';
import { LoginSession } from '../../auth/entities/login-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LinkedAccount,
      AccountProfileEntity,
      LoginApproval,
      IdentitySettings,
      TrustIndicator,
      SecurityAlertEntity,
      User,
      Post,
      AccountDeletionRequest,
      AccountHistoryEntity,
      AccountSessionEntity,
      AccountRecoveryRequest,
      LoginSession,
    ]),
    UsersModule,
    NotificationsModule,
    SecurityAuditModule,
    DataExportModule,
  ],
  providers: [
    AccountManagementService,
    AccountLinkingService,
    LoginApprovalService,
    IdentitySettingsService,
    TrustIndicatorService,
    AdPreferencesService,
    SecuritySettingsService,
  ],
  controllers: [AccountManagementController],
  exports: [
    AccountManagementService,
    AccountLinkingService,
    LoginApprovalService,
    IdentitySettingsService,
    TrustIndicatorService,
    AdPreferencesService,
    SecuritySettingsService,
  ],
})
export class AccountManagementModule {}
