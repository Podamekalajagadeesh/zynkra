import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureService } from './infrastructure.service';
import { BackupService } from './backup.service';
import { InfrastructureController } from './infrastructure.controller';
import { WellKnownController } from './well-known.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformStatusSnapshotEntity } from './entities/platform-status-snapshot.entity';
import { PlatformIncidentEntity } from './entities/platform-incident.entity';
import { PlatformMaintenanceEntity } from './entities/platform-maintenance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forFeature([
      PlatformStatusSnapshotEntity,
      PlatformIncidentEntity,
      PlatformMaintenanceEntity,
    ]),
  ],
  controllers: [InfrastructureController, WellKnownController],
  providers: [
    InfrastructureService,
    {
      provide: BackupService,
      useFactory: () => new BackupService({ workspaceRoot: process.cwd() }),
    },
  ],
  exports: [InfrastructureService, BackupService],
})
export class InfrastructureModule {}
