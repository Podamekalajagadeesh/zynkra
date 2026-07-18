import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NeurodiverseCommunitiesService } from './neurodiverse-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('neurodiverse-communities')
export class NeurodiverseCommunitiesController {
  constructor(private readonly neurodiverseCommunitiesService: NeurodiverseCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.neurodiverseCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.neurodiverseCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neurodiverseCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neurodiverseCommunitiesService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.neurodiverseCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neurodiverseCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.neurodiverseCommunitiesService.getCommunityMembers(id);
  }
}
