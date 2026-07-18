import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snooze } from './entities/snooze.entity';
import { SnoozeService } from './snooze.service';
import { SnoozeController } from './snooze.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Snooze]), AuthModule],
  providers: [SnoozeService],
  controllers: [SnoozeController],
  exports: [SnoozeService],
})
export class SnoozeModule {}