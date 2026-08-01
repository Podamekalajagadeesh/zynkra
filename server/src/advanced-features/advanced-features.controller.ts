import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TranslationService } from '../translation/translation.service';

interface FeatureStatus {
  supported: boolean;
  enabled: boolean;
  description: string;
}

@Controller('advanced-features')
export class AdvancedFeaturesController {
  constructor(private readonly translationService: TranslationService) {}

  @Get('status')
  getStatus(): Record<string, FeatureStatus> {
    return {
      spaceSatellite: {
        supported: false,
        enabled: false,
        description: 'Preview — satellite-based connectivity for remote regions.',
      },
      meshSync: {
        supported: false,
        enabled: false,
        description: 'Preview — peer-to-peer mesh syncing for offline communities.',
      },
      eInkReader: {
        supported: false,
        enabled: false,
        description: 'Preview — optimized layout for e-ink displays.',
      },
      inCarIntegration: {
        supported: false,
        enabled: false,
        description: 'Preview — in-car dashboard integration.',
      },
      vrAr: {
        supported: false,
        enabled: false,
        description: 'Preview — immersive VR/AR experiences.',
      },
      deepfakeDetection: {
        supported: true,
        enabled: true,
        description: 'AI-powered deepfake detection for uploaded media.',
      },
      realTimeTranslation: {
        supported: true,
        enabled: true,
        description: 'Real-time translation across 26 languages.',
      },
    };
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  translate(@Body() body: { text?: string; targetLanguage?: string }) {
    return this.translationService.translate(body?.text || '', 'auto', body?.targetLanguage || 'en');
  }
}
