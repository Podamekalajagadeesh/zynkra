import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { AdvancedModerationController } from './advanced-moderation.controller';
import { ModerationService } from './services/moderation.service';
import { NeuralModerationService } from './services/neural-moderation.service';
import { DeepfakeDetectionService } from './services/deepfake-detection.service';
import { BiasDetectionService } from './services/bias-detection.service';
import { AdvancedModerationService } from './advanced-moderation.service';
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
  controllers: [ModerationController, AdvancedModerationController],
  providers: [
    ModerationService,
    NeuralModerationService,
    DeepfakeDetectionService,
    BiasDetectionService,
    AdvancedModerationService
  ],
  exports: [ModerationService, NeuralModerationService, DeepfakeDetectionService, BiasDetectionService, AdvancedModerationService]
})
export class ModerationModule {}