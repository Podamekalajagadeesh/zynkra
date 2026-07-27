import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiContentService } from './ai-content.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { OptimizeContentDto } from './dto/optimize-content.dto';
import { AiAnalyzeContentDto } from './dto/analyze-content.dto';
import { CaptionDto } from './dto/caption.dto';
import { HashtagsDto } from './dto/hashtags.dto';
import { BestTimeDto } from './dto/best-time.dto';
import { ChatDto } from './dto/chat.dto';

// AI endpoints are more expensive — lower rate limits than default (300/min).
const AI_RATE = { default: { ttl: 60_000, limit: 30 } };
const AI_CHAT_RATE = { default: { ttl: 60_000, limit: 15 } };

@Controller('ai/content')
export class AiContentController {
  private readonly logger = new Logger(AiContentController.name);

  constructor(private readonly aiContentService: AiContentService) {}

  @Throttle(AI_RATE)
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateContent(@Body() body: GenerateContentDto) {
    return this.aiContentService.generateContent(body as any);
  }

  @Throttle(AI_RATE)
  @Post('optimize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async optimizeContent(@Body() body: OptimizeContentDto) {
    return this.aiContentService.optimizeContent(body.content);
  }

  @Throttle(AI_RATE)
  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async analyzeContent(@Body() body: AiAnalyzeContentDto) {
    return this.aiContentService.analyzeContent(body.content);
  }

  @Throttle(AI_RATE)
  @Post('caption')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateCaption(@Body() body: CaptionDto) {
    return this.aiContentService.generateCaption(body.mediaType as any, body.keywords);
  }

  @Throttle(AI_RATE)
  @Post('hashtags')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateHashtags(@Body() body: HashtagsDto) {
    return this.aiContentService.generateHashtags(body.topic, body.keywords);
  }

  @Throttle(AI_RATE)
  @Post('best-time')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  suggestBestTime(@Body() body: BestTimeDto) {
    return this.aiContentService.suggestBestTime(body.contentType as any);
  }

  /**
   * Chat completion for the AI chatbot widget.
   * Returns SSE stream when Accept header allows it, otherwise JSON.
   */
  @Throttle(AI_CHAT_RATE)
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chat(@Body() chatDto: ChatDto, @Req() req: any, @Res() res: Response) {
    const acceptsStream = req.headers.accept?.includes('text/event-stream');

    if (acceptsStream) {
      // SSE streaming mode
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const stream = this.aiContentService.chatCompletion(chatDto);
        stream.subscribe({
          next: (chunk: string) => {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          },
          complete: () => {
            res.write('data: [DONE]\n\n');
            res.end();
          },
          error: (err: Error) => {
            this.logger.warn(`Chat SSE error: ${err.message}`);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
          },
        });
      } catch (error: any) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming: collect the Observable into a complete response
      try {
        const chunks: string[] = [];
        const stream = this.aiContentService.chatCompletion(chatDto);
        await new Promise<void>((resolve, reject) => {
          stream.subscribe({
            next: (chunk: string) => chunks.push(chunk),
            complete: () => resolve(),
            error: (err: Error) => reject(err),
          });
        });
        res.json({ content: chunks.join('') });
      } catch (error: any) {
        this.logger.warn(`Chat error: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    }
  }
}
