import { Controller, Get, Post, Body } from '@nestjs/common';
import { AdvancedFeaturesService } from './advanced-features.service';

@Controller('advanced-features')
export class AdvancedFeaturesController {
  constructor(private readonly advancedFeaturesService: AdvancedFeaturesService) {}

  @Get('status')
  getStatus() {
    return this.advancedFeaturesService.getStatus();
  }

  @Post('translate')
  translate(@Body() body: { text: string; targetLanguage: string }) {
    return this.advancedFeaturesService.translateText(body.text, body.targetLanguage);
  }
}
