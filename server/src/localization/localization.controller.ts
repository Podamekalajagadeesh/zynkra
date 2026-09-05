import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocalizationService } from './localization.service';

@Controller('localization')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('languages')
  getLanguages() {
    return this.localizationService.getSupportedLanguages();
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  getPreferences(@Req() request: any) {
    return this.localizationService.getPreferences(request.user.userId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(@Req() request: any, @Body() body: Record<string, string>) {
    return this.localizationService.updatePreferences(request.user.userId, body);
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  translate(@Body() body: { text: string; sourceLanguage?: string; targetLanguage: string }) {
    return this.localizationService.translate(body.text, body.sourceLanguage, body.targetLanguage);
  }

  @Post('format-date')
  formatDate(@Body() body: { value: string; locale: string; timezone?: string }) {
    return { value: this.localizationService.formatDate(body.value, body.locale, body.timezone) };
  }

  @Post('format-currency')
  formatCurrency(@Body() body: { value: number; currency: string; locale: string }) {
    return { value: this.localizationService.formatCurrency(body.value, body.currency, body.locale) };
  }
}
