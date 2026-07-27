import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranslationService } from './translation.service';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get('languages')
  getLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  @Post('detect')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async detectLanguage(@Body() body: { text: string }) {
    return this.translationService.detectLanguage(body.text);
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async translate(@Body() body: {
    text: string;
    sourceLang?: string;
    targetLang: string;
  }) {
    return this.translationService.translate(body.text, body.sourceLang || 'auto', body.targetLang);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async translateBatch(@Body() body: {
    texts: string[];
    sourceLang?: string;
    targetLang: string;
  }) {
    return this.translationService.translateBatch(body.texts, body.sourceLang || 'auto', body.targetLang);
  }
}
