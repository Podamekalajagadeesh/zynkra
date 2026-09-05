import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ChangelogController } from './changelog.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangelogEntryEntity } from './entities/changelog-entry.entity';
import { ChangelogService } from './changelog.service';
import { SandboxEnvironmentEntity } from './entities/sandbox-environment.entity';
import { SandboxEnvironmentsService } from './sandbox-environments.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([ChangelogEntryEntity, SandboxEnvironmentEntity])],
  controllers: [AdminController, ChangelogController],
  providers: [ChangelogService, SandboxEnvironmentsService],
  exports: [SandboxEnvironmentsService],
})
export class AdminModule {}