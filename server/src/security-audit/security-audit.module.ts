import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityAuditService } from './security-audit.service';
import { SecurityAuditController } from './security-audit.controller';
import { SecurityAuditLog } from './entities/security-audit.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SecurityAuditLog, User])],
  providers: [SecurityAuditService],
  controllers: [SecurityAuditController],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}
