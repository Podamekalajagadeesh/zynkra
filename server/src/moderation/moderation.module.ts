import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './services/moderation.service';
import { NeuralModerationService } from './services/neural-moderation.service';
import { DeepfakeDetectionService } from './services/deepfake-detection.service';
import { BiasDetectionService } from './services/bias-detection.service';
import { ModerationQueueItemEntity } from './entities/moderation-queue-item.entity';
import { ContentFlagEntity } from './entities/content-flag.entity';
import { NeuralThoughtFlagEntity } from './entities/neural-thought-flag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModerationQueueItemEntity,
      ContentFlagEntity,
      NeuralThoughtFlagEntity
    ])
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    NeuralModerationService,
    DeepfakeDetectionService,
    BiasDetectionService
  ],
  exports: [ModerationService, NeuralModerationService, DeepfakeDetectionService, BiasDetectionService]
})
export class ModerationModule {}