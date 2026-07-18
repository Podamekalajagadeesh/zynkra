import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdvancedFeaturesService } from './advanced-features.service';

@Controller('advanced-features')
@UseGuards(JwtAuthGuard)
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
