import { Module } from '@nestjs/common';
import { AdvancedFeaturesController } from './advanced-features.controller';
import { AdvancedFeaturesService } from './advanced-features.service';

@Module({
  controllers: [AdvancedFeaturesController],
  providers: [AdvancedFeaturesService],
  exports: [AdvancedFeaturesService],
})
export class AdvancedFeaturesModule {}
