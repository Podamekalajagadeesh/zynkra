import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRequest } from './entities/verification-request.entity';
import { VerificationAppeal } from './entities/verification-appeal.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationRequest, VerificationAppeal, User])],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
