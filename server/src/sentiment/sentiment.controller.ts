import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SentimentService, SentimentAnalysisResult } from './sentiment.service';

@Controller('sentiment')
@UseGuards(JwtAuthGuard)
export class SentimentController {
  constructor(private readonly sentimentService: SentimentService) {}

  @Post('analyze')
  async analyze(@Body() body: { text?: string }): Promise<SentimentAnalysisResult> {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      throw new BadRequestException('text is required');
    }
    if (text.length > 5000) {
      throw new BadRequestException('text must be 5000 characters or fewer');
    }
    return this.sentimentService.analyzeSentiment(text);
  }
}
