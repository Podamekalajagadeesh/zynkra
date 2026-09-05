import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { DocumentVerificationController } from './document-verification.controller';
import { DocumentProcessingService } from './document-processing.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentValidationEngine } from './document-validation.engine';
import { VerificationRequest } from './entities/verification-request.entity';
import { VerificationBadge } from './entities/verification-badge.entity';
import { VerificationHistory } from './entities/verification-history.entity';
import { VerificationAppeal } from './entities/verification-appeal.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import {
  DocumentVerificationRecord,
  DocumentValidationRule,
  DocumentVerificationAuditLog,
  DocumentVerificationAppeal,
  DocumentVerificationStats,
} from './entities/document-verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerificationRequest,
      VerificationBadge,
      VerificationHistory,
      VerificationAppeal,
      User,
      DocumentVerificationRecord,
      DocumentValidationRule,
      DocumentVerificationAuditLog,
      DocumentVerificationAppeal,
      DocumentVerificationStats,
    ]),
    NotificationsModule,
  ],
  providers: [
    VerificationService,
    DocumentProcessingService,
    DocumentStorageService,
    DocumentValidationEngine,
  ],
  controllers: [VerificationController, DocumentVerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
