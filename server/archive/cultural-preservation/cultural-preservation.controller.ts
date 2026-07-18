import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CulturalPreservationService } from './cultural-preservation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('cultural-preservation')
export class CulturalPreservationController {
  constructor(private readonly culturalPreservationService: CulturalPreservationService) {}

  @Get()
  async getAllCommunities() {
    return this.culturalPreservationService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.culturalPreservationService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.culturalPreservationService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.culturalPreservationService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.culturalPreservationService.getCommunityMembers(id);
  }

  @Get(':id/archives')
  async getCommunityArchives(@Param('id') id: string) {
    return this.culturalPreservationService.getCommunityArchives(id);
  }

  @Post(':id/archives')
  @UseGuards(JwtAuthGuard)
  async createArchive(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.culturalPreservationService.createArchive(body, id, userId);
  }
}
