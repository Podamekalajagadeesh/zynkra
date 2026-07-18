import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SkillSharingService } from './skill-sharing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('skill-sharing')
export class SkillSharingController {
  constructor(private readonly skillSharingService: SkillSharingService) {}

  @Get()
  async getAllCommunities() {
    return this.skillSharingService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.skillSharingService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.skillSharingService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.skillSharingService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.skillSharingService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.skillSharingService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.skillSharingService.getCommunityMembers(id);
  }

  @Get(':id/exchanges')
  async getCommunityExchanges(@Param('id') id: string) {
    return this.skillSharingService.getCommunityExchanges(id);
  }

  @Post('immersive-learning')
  @UseGuards(JwtAuthGuard)
  async createImmersiveLearningSession(@Req() req: Request, @Body() body: any) {
    return this.skillSharingService.createImmersiveLearningSession(body);
  }

  @Post(':id/exchanges')
  @UseGuards(JwtAuthGuard)
  async createExchange(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.skillSharingService.createExchange(body, id, userId);
  }
}
