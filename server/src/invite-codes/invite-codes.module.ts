import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { InviteCode } from './invite-code.entity';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodesController } from './invite-codes.controller';
import { InviteCodeAdminGuard } from './invite-code-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([InviteCode]), UsersModule],
  controllers: [InviteCodesController],
  providers: [InviteCodesService, InviteCodeAdminGuard],
  exports: [InviteCodesService],
})
export class InviteCodesModule {}
