import { Controller, Get, Post, Body, UseGuards, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmartFeedService } from './smart-feed.service';
import { TranslationService } from '../translation/translation.service';

@Controller('feed')
export class SmartFeedController {
  constructor(
    private readonly smartFeedService: SmartFeedService,
    private readonly translationService: TranslationService,
  ) {}

  /**
   * Get available feed algorithms.
   */
  @Get('algorithms')
  getAlgorithms() {
    return this.smartFeedService.getAlgorithms();
  }

  /**
   * Get current feed algorithm for the user.
   */
  @Get('algorithm')
  @UseGuards(JwtAuthGuard)
  async getMyAlgorithm(@Req() req) {
    const algorithm = await this.smartFeedService.getUserAlgorithm(req.user.userId || req.user.id);
    return { algorithm };
  }

  /**
   * Set feed algorithm for the user.
   */
  @Post('algorithm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setAlgorithm(@Req() req, @Body() body: { algorithm: string }) {
    await this.smartFeedService.setUserAlgorithm(req.user.userId || req.user.id, body.algorithm);
    return { success: true, algorithm: body.algorithm };
  }

  /**
   * Get personalized feed using the selected algorithm.
   */
  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedFeed(
    @Req() req,
    @Query('algorithm') algorithm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.smartFeedService.generateFeed(req.user.userId || req.user.id, {
      algorithm,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Translate a post to the user's preferred language.
   */
  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async translatePost(@Body() body: { content: string; targetLang: string }) {
    return this.translationService.translate(body.content, 'auto', body.targetLang);
  }

  /**
   * Get supported languages for translation.
   */
  @Get('languages')
  getLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  /**
   * Get feed stats.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getFeedStats(@Req() req) {
    return this.smartFeedService.getFeedStats(req.user.userId || req.user.id);
  }
}
