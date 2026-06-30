
import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateAdSetDto } from './dto/create-ad-set.dto';
import { CurrentUser } from '../../src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('campaigns')
  getCampaigns(@CurrentUser() user: any) {
    return this.adsService.getCampaigns(user.id);
  }

  @Post('campaigns')
  createCampaign(@Body() createCampaignDto: CreateCampaignDto) {
    return this.adsService.createCampaign(createCampaignDto);
  }

  @Get('adsets/:campaignId')
  getAdSets(@Param('campaignId') campaignId: string) {
    return this.adsService.getAdSets(campaignId);
  }

  @Post('adsets')
  createAdSet(@Body() createAdSetDto: CreateAdSetDto) {
    return this.adsService.createAdSet(createAdSetDto);
  }

  @Get('ads/:adSetId')
  getAds(@Param('adSetId') adSetId: string) {
    return this.adsService.getAds(adSetId);
  }
}