import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureService } from './infrastructure.service';
import { BackupService } from './backup.service';
import { InfrastructureController } from './infrastructure.controller';
import { WellKnownController } from './well-known.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
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
