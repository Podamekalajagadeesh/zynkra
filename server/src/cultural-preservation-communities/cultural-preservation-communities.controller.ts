import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CulturalPreservationCommunitiesService } from './cultural-preservation-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('cultural-preservation-communities')
export class CulturalPreservationCommunitiesController {
  constructor(private readonly culturalPreservationCommunitiesService: CulturalPreservationCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.culturalPreservationCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.culturalPreservationCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationCommunitiesService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.culturalPreservationCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.culturalPreservationCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.culturalPreservationCommunitiesService.getCommunityMembers(id);
  }

  @Get(':id/archive')
  async getArchiveEntries(@Param('id') id: string) {
    return this.culturalPreservationCommunitiesService.getArchiveEntries(id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async createArchiveEntry(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationCommunitiesService.createArchiveEntry(body, id, userId);
  }
}