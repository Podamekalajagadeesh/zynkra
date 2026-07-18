import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PlanetaryCommunitiesService } from './planetary-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('planetary-communities')
export class PlanetaryCommunitiesController {
  constructor(private readonly planetaryCommunitiesService: PlanetaryCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.planetaryCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.planetaryCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.planetaryCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.planetaryCommunitiesService.joinCommunity(id, userId);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.planetaryCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.planetaryCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.planetaryCommunitiesService.getCommunityMembers(id);
  }
}
