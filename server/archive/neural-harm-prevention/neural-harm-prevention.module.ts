import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralHarmPreventionService } from './neural-harm-prevention.service';
import { NeuralHarmPreventionController } from './neural-harm-prevention.controller';
import { HarmPreventionLog } from './entities/harm-prevention-log.entity';
import { UserHarmPreferences } from './entities/user-harm-preferences.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HarmPreventionLog, UserHarmPreferences])],
  controllers: [NeuralHarmPreventionController],
  providers: [NeuralHarmPreventionService],
  exports: [NeuralHarmPreventionService],
})
export class NeuralHarmPreventionModule {}
