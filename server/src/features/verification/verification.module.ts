import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationRequest } from './entities/verification-request.entity';
import { VerificationBadge } from './entities/verification-badge.entity';
import { VerificationHistory } from './entities/verification-history.entity';
import { VerificationAppeal } from './entities/verification-appeal.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerificationRequest,
      VerificationBadge,
      VerificationHistory,
      VerificationAppeal,
      User,
    ]),
    NotificationsModule,
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
