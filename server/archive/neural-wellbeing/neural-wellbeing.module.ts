import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeuralWellbeingService } from './neural-wellbeing.service';
import { NeuralWellbeingController } from './neural-wellbeing.controller';
import { NeuralStateLog } from './entities/neural-state-log.entity';
import { WellbeingSuggestion } from './entities/wellbeing-suggestion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NeuralStateLog, WellbeingSuggestion])],
  controllers: [NeuralWellbeingController],
  providers: [NeuralWellbeingService],
  exports: [NeuralWellbeingService],
})
export class NeuralWellbeingModule {}
