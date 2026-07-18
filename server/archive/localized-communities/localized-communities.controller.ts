import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LocalizedCommunitiesService } from './localized-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('localized-communities')
export class LocalizedCommunitiesController {
  constructor(private readonly localizedCommunitiesService: LocalizedCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.localizedCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.localizedCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.localizedCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.localizedCommunitiesService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.localizedCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.localizedCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.localizedCommunitiesService.getCommunityMembers(id);
  }

  @Get(':id/meetups')
  async getCommunityMeetups(@Param('id') id: string) {
    return this.localizedCommunitiesService.getCommunityMeetups(id);
  }

  @Post(':id/meetups')
  @UseGuards(JwtAuthGuard)
  async createMeetup(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.localizedCommunitiesService.createMeetup(body, id);
  }
}
