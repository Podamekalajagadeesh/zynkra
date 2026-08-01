import { Module } from '@nestjs/common';
import { TranslationModule } from '../translation/translation.module';
import { AdvancedFeaturesController } from './advanced-features.controller';

@Module({
  imports: [TranslationModule],
  controllers: [AdvancedFeaturesController],
})
export class AdvancedFeaturesModule {}
