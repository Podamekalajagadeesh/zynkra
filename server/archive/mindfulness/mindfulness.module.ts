import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MindfulnessService } from './mindfulness.service';
import { MindfulnessController } from './mindfulness.controller';
import { MindfulnessSetting } from './entities/mindfulness-setting.entity';
import { UsageSession } from './entities/usage-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MindfulnessSetting, UsageSession])],
  controllers: [MindfulnessController],
  providers: [MindfulnessService],
  exports: [MindfulnessService],
})
export class MindfulnessModule {}
