import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SocialUBIService } from './social-ubi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('social-ubi')
export class SocialUBIController {
  constructor(private readonly socialUBIService: SocialUBIService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reward')
  async createReward(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.socialUBIService.createParticipationReward(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-rewards')
  async getMyRewards(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.socialUBIService.getUserParticipationRewards(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-total')
  async getMyTotal(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.socialUBIService.getUserTotalRewards(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-disbursements')
  async getMyDisbursements(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.socialUBIService.getUserDisbursements(userId);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    if ((req.user as any)?.id) {
      return this.socialUBIService.getStats((req.user as any).id);
    }
    return this.socialUBIService.getStats();
  }
}
