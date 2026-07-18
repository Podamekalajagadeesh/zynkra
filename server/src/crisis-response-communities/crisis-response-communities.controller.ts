import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CrisisResponseCommunitiesService } from './crisis-response-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('crisis-response-communities')
export class CrisisResponseCommunitiesController {
  constructor(private readonly crisisResponseCommunitiesService: CrisisResponseCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.crisisResponseCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.crisisResponseCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.crisisResponseCommunitiesService.getCommunityMembers(id);
  }

  @Get(':id/aid-requests')
  async getAidRequests(@Param('id') id: string) {
    return this.crisisResponseCommunitiesService.getAidRequests(id);
  }

  @Post(':id/aid-requests')
  @UseGuards(JwtAuthGuard)
  async createAidRequest(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.createAidRequest(body, id, userId);
  }

  @Patch(':communityId/aid-requests/:requestId')
  @UseGuards(JwtAuthGuard)
  async updateAidRequest(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('requestId') requestId: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.crisisResponseCommunitiesService.updateAidRequest(communityId, requestId, body, userId);
  }
}