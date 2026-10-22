import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ChangelogController } from './changelog.controller';
import { UsersModule } from '../users/users.module';
import { ReportsModule } from '../reports/reports.module';
import { PostsModule } from '../posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangelogEntryEntity } from './entities/changelog-entry.entity';
import { ChangelogService } from './changelog.service';
import { SandboxEnvironmentEntity } from './entities/sandbox-environment.entity';
import { SandboxEnvironmentsService } from './sandbox-environments.service';

@Module({
  imports: [
    UsersModule,
    ReportsModule,
    PostsModule,
    TypeOrmModule.forFeature([ChangelogEntryEntity, SandboxEnvironmentEntity]),
  ],
  controllers: [AdminController, ChangelogController],
  providers: [AdminService, ChangelogService, SandboxEnvironmentsService],
  exports: [SandboxEnvironmentsService],
})
export class AdminModule {}
