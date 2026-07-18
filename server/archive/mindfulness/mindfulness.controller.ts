import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MindfulnessService } from './mindfulness.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { SessionType } from './entities/usage-session.entity';

@Controller('mindfulness')
@UseGuards(JwtAuthGuard)
export class MindfulnessController {
  constructor(private readonly mindfulnessService: MindfulnessService) {}

  @Get('settings')
  async getMySettings(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.getUserSetting(userId);
  }

  @Patch('settings')
  async updateSetting(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.updateSetting(userId, body);
  }

  @Post('session/start')
  async startSession(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.startSession(
      userId,
      body.sessionType || SessionType.NEURAL_CONTENT,
      body.contentTypes,
    );
  }

  @Post('session/:id/end')
  async endSession(@Param('id') id: string, @Body() body: any) {
    return this.mindfulnessService.endSession(id, body.stressLevel);
  }

  @Get('usage/today')
  async getTodayUsage(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.getTodayUsage(userId);
  }

  @Get('check-time-limit')
  async checkTimeLimit(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.checkTimeLimit(userId);
  }

  @Get('check-session/:sessionId')
  async checkSessionDuration(@Param('sessionId') sessionId: string) {
    return this.mindfulnessService.checkSessionDuration(sessionId);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.mindfulnessService.getStats(userId);
  }
}
