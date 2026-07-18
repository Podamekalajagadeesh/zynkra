import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AccessibilityFirstCommunitiesService } from './accessibility-first-communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('accessibility-first-communities')
export class AccessibilityFirstCommunitiesController {
  constructor(private readonly accessibilityFirstCommunitiesService: AccessibilityFirstCommunitiesService) {}

  @Get()
  async getAllCommunities() {
    return this.accessibilityFirstCommunitiesService.getAllCommunities();
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string) {
    return this.accessibilityFirstCommunitiesService.getCommunityById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.createCommunity(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCommunity(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.joinCommunity(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCommunity(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.leaveCommunity(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getCommunityMembers(@Param('id') id: string) {
    return this.accessibilityFirstCommunitiesService.getCommunityMembers(id);
  }

  @Get(':id/accommodations')
  async getAccommodationRequests(@Param('id') id: string) {
    return this.accessibilityFirstCommunitiesService.getAccommodationRequests(id);
  }

  @Post(':id/accommodations')
  @UseGuards(JwtAuthGuard)
  async createAccommodationRequest(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.createAccommodationRequest(body, id, userId);
  }

  @Patch(':communityId/accommodations/:requestId')
  @UseGuards(JwtAuthGuard)
  async updateAccommodationRequest(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('requestId') requestId: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.accessibilityFirstCommunitiesService.updateAccommodationRequest(communityId, requestId, body, userId);
  }
}