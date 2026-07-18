import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NeuralHarmPreventionService } from './neural-harm-prevention.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('neural-harm-prevention')
export class NeuralHarmPreventionController {
  constructor(private readonly neuralHarmPreventionService: NeuralHarmPreventionService) {}

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralHarmPreventionService.getUserPreferences(userId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neuralHarmPreventionService.updatePreferences(userId, body);
  }

  @Post('check-content')
  async checkContent(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.id;
    return this.neuralHarmPreventionService.checkContentForHarm(
      userId,
      body.contentId,
      body.contentMetadata,
    );
  }

  @Get('logs/my')
  @UseGuards(JwtAuthGuard)
  async getMyLogs(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralHarmPreventionService.getUserLogs(userId);
  }

  @Get('logs/all')
  async getAllLogs() {
    return this.neuralHarmPreventionService.getAllLogs();
  }

  @Get('stats')
  async getStats() {
    return this.neuralHarmPreventionService.getStats();
  }
}
