import { Controller, Post, Body, Get, UseGuards, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdvancedModerationService } from './advanced-moderation.service';

@Controller('moderation')
export class AdvancedModerationController {
  constructor(private readonly moderationService: AdvancedModerationService) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  analyzeContent(@Body() body: {
    content: string;
    authorId?: string;
    isPublic?: boolean;
    contentType?: 'post' | 'message' | 'comment';
  }) {
    return this.moderationService.analyzeContent(body.content, {
      authorId: body.authorId,
      isPublic: body.isPublic,
      contentType: body.contentType,
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.moderationService.getModerationStats();
  }

  @Get('user/:userId/report')
  @UseGuards(JwtAuthGuard)
  getUserReport(@Param('userId') userId: string) {
    return this.moderationService.generateUserReport(userId);
  }
}
