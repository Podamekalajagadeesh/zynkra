import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SpeciesCommunitiesService } from './species-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('species-communities')
export class SpeciesCommunitiesController {
  constructor(private readonly speciesCommunitiesService: SpeciesCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.speciesCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.speciesCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.speciesCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.speciesCommunitiesService.joinCommunity(id, { ...body, userId });
  }

  @Delete(':id/leave/:memberId')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.speciesCommunitiesService.leaveCommunity(id, memberId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.speciesCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.speciesCommunitiesService.getCommunityMembers(id);
  }

  @Get(':id/messages')
  async getCommunityMessages(@Param('id') id: string) {
    return this.speciesCommunitiesService.getCommunityMessages(id);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.speciesCommunitiesService.sendMessage({ ...body, senderId: userId }, id);
  }
}
