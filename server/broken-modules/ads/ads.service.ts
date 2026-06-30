
import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { Campaign } from '../../src/campaign.entity';
import { AdSet } from '../../src/ad-set.entity';
import { AdsManagerService } from '../../src/ads-manager.service';

@Injectable()
export class AdsService {
  constructor(
    private readonly adsManagerService: AdsManagerService,
  ) {}

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return this.adsManagerService.getCampaigns(userId);
  }

  async getAdSets(campaignId: string): Promise<AdSet[]> {
    // This will need to be implemented to fetch ad sets from the database
    return [];
  }

  async getAds(adSetId: string): Promise<any[]> {
    // This will need to be implemented to fetch ads from the database
    return [];
  }

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const { profileId, name, objective, postId } = createCampaignDto;
    return this.adsManagerService.createCampaign(profileId, name, objective, [], postId);
  }

  async createAdSet(createAdSetDto: any): Promise<any> {
    // This will need to be implemented to create ad sets via a dedicated service
    // For now, returning a mock object
    return { id: 'mockAdSetId', ...createAdSetDto };
  }
}