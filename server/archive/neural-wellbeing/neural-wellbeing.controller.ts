import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NeuralWellbeingService } from './neural-wellbeing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { SuggestionStatus } from './entities/wellbeing-suggestion.entity';

@Controller('neural-wellbeing')
@UseGuards(JwtAuthGuard)
export class NeuralWellbeingController {
  constructor(private readonly neuralWellbeingService: NeuralWellbeingService) {}

  @Post('log')
  async logState(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.logNeuralState(userId, body);
  }

  @Get('logs')
  async getLogs(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.getUserLogs(userId);
  }

  @Post('suggestions/generate')
  async generateSuggestion(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.generateSuggestion(userId, body);
  }

  @Get('suggestions')
  async getSuggestions(
    @Req() req: Request,
    @Param('status') status?: SuggestionStatus,
  ) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.getUserSuggestions(userId, status);
  }

  @Patch('suggestions/:id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: SuggestionStatus,
  ) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.updateSuggestionStatus(id, userId, status);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralWellbeingService.getWellbeingStats(userId);
  }
}
