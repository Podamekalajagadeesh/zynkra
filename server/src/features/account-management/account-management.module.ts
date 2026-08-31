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
import { LoginApproval } from './entities/login-approval.entity';
import { IdentitySettings } from './entities/identity-settings.entity';
import { TrustIndicator } from './entities/trust-indicator.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LinkedAccount,
      LoginApproval,
      IdentitySettings,
      TrustIndicator,
      User,
      Post,
    ]),
    NotificationsModule,
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
