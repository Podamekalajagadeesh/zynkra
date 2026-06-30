import { Controller, Get, Post, Body, UseGuards, Request, Param, Redirect, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { Request as ExpressRequest } from 'express';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('links')
  async createLink(@Request() req, @Body() dto: CreateAffiliateLinkDto) {
    return this.affiliatesService.createAffiliateLink(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('links')
  async getMyLinks(@Request() req) {
    return this.affiliatesService.getUserAffiliateLinks(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getMyStats(@Request() req) {
    return this.affiliatesService.getAffiliateLinkStats(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('links/:id/performance')
  async getLinkPerformance(@Request() req, @Param('id') linkId: string) {
    return this.affiliatesService.getLinkPerformance(linkId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('links/:id/delete')
  async deleteLink(@Request() req, @Param('id') linkId: string) {
    return this.affiliatesService.deleteAffiliateLink(linkId, req.user.userId);
  }

  @Get('r/:slug')
  @Redirect()
  async redirectToDestination(@Param('slug') slug: string, @Req() req: ExpressRequest) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer');

    const destinationUrl = await this.affiliatesService.trackClick(
      slug,
      ipAddress,
      userAgent,
      referrer
    );

    return { url: destinationUrl, statusCode: 302 };
  }
}