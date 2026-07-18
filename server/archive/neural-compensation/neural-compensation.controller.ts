import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { NeuralCompensationService } from './neural-compensation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('neural-compensation')
export class NeuralCompensationController {
  constructor(private readonly neuralCompensationService: NeuralCompensationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('process')
  async processMicrotransaction(@Req() req: Request, @Body() body: any) {
    const consumerId = (req.user as any).id;
    return this.neuralCompensationService.processMicrotransaction({
      consumerId,
      creatorId: body.creatorId,
      amount: body.amount,
      contentType: body.contentType,
      contentId: body.contentId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getCreatorStats(@Req() req: Request) {
    const creatorId = (req.user as any).id;
    return this.neuralCompensationService.getCreatorStats(creatorId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getConsumerHistory(@Req() req: Request) {
    const consumerId = (req.user as any).id;
    return this.neuralCompensationService.getConsumerHistory(consumerId);
  }
}
