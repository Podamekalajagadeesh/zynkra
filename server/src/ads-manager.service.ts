
import { Injectable } from '@nestjs/common';
import { Campaign } from './campaign.entity';
import { AdSet } from './ad-set.entity';
import { Ad } from './ad.entity';

// Extended interfaces with targeting and performance metrics
interface AdSetWithMetrics extends AdSet {
  targeting?: {
    age?: { min: number; max: number };
    gender?: 'male' | 'female' | 'all';
    locations?: string[];
    interests?: string[];
  };
  impressions: number;
  clicks: number;
  spend: number;
}

interface AdWithMetrics extends Ad {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface CampaignWithMetrics extends Campaign {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  ctr: number;
  cpc: number;
}

const campaigns: CampaignWithMetrics[] = [
  { 
    id: '1', 
    name: 'Summer Sale', 
    objective: 'SALES', 
    status: 'ACTIVE', 
    special_ad_categories: [],
    totalImpressions: 125000,
    totalClicks: 4500,
    totalSpend: 2850,
    ctr: 3.6,
    cpc: 0.63
  },
  { 
    id: '2', 
    name: 'Brand Awareness Q3', 
    objective: 'BRAND_AWARENESS', 
    status: 'PAUSED', 
    special_ad_categories: [],
    totalImpressions: 89000,
    totalClicks: 2100,
    totalSpend: 1950,
    ctr: 2.36,
    cpc: 0.93
  },
];

const adSets: AdSetWithMetrics[] = [
  { 
    id: '101', 
    name: 'Ad Set 1', 
    campaign_id: '1', 
    daily_budget: 50, 
    bid_strategy: 'LOWEST_COST_WITHOUT_BID', 
    status: 'ACTIVE',
    targeting: {
      age: { min: 18, max: 65 },
      gender: 'all',
      locations: ['United States', 'Canada'],
      interests: ['Fashion', 'Shopping', 'E-commerce']
    },
    impressions: 78000,
    clicks: 2800,
    spend: 1750
  },
  { 
    id: '102', 
    name: 'Ad Set 2', 
    campaign_id: '1', 
    daily_budget: 75, 
    bid_strategy: 'LOWEST_COST_WITH_BID_CAP', 
    status: 'PAUSED',
    targeting: {
      age: { min: 21, max: 55 },
      gender: 'all',
      locations: ['United Kingdom', 'Germany'],
      interests: ['Luxury', 'Premium Brands']
    },
    impressions: 47000,
    clicks: 1700,
    spend: 1100
  },
];

const ads: AdWithMetrics[] = [
  { 
    id: '1001', 
    ad_set_id: '101', 
    name: 'Ad 1', 
    status: 'ACTIVE', 
    creative: { 
      body: 'Check out our summer sale!', 
      image_url: 'https://via.placeholder.com/1200x628' 
    },
    impressions: 45000,
    clicks: 1650,
    conversions: 120,
    spend: 950
  },
  { 
    id: '1002', 
    ad_set_id: '101', 
    name: 'Ad 2', 
    status: 'IN_REVIEW', 
    creative: { 
      body: 'New arrivals are here!', 
      image_url: 'https://via.placeholder.com/1200x628' 
    },
    impressions: 33000,
    clicks: 1150,
    conversions: 78,
    spend: 800
  },
];

@Injectable()
export class AdsManagerService {
  // Campaign methods
  async getCampaigns(userId: string): Promise<CampaignWithMetrics[]> {
    return campaigns;
  }

  async getCampaignById(campaignId: string): Promise<CampaignWithMetrics | undefined> {
    return campaigns.find(campaign => campaign.id === campaignId);
  }

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<CampaignWithMetrics | null> {
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return null;
    campaigns[index] = { ...campaigns[index], ...updates };
    return campaigns[index];
  }

  async deleteCampaign(campaignId: string): Promise<boolean> {
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return false;
    campaigns.splice(index, 1);
    // Delete associated ad sets and ads
    const relatedAdSetIds = adSets.filter(a => a.campaign_id === campaignId).map(a => a.id);
    const adSetIndices = adSets.map((a, i) => a.campaign_id === campaignId ? i : -1).filter(i => i !== -1);
    adSetIndices.reverse().forEach(i => adSets.splice(i, 1));
    const adIndices = ads.map((a, i) => relatedAdSetIds.includes(a.ad_set_id) ? i : -1).filter(i => i !== -1);
    adIndices.reverse().forEach(i => ads.splice(i, 1));
    return true;
  }

  async createCampaign(profileId: string, name: string, objective: string, adSetsData: any[] = [], postId?: string): Promise<CampaignWithMetrics> {
    const newCampaign: CampaignWithMetrics = {
      id: Date.now().toString(),
      name,
      objective: objective as any,
      status: 'ACTIVE',
      special_ad_categories: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      ctr: 0,
      cpc: 0
    };
    campaigns.push(newCampaign);

    // Create associated ad sets if provided
    if (adSetsData.length > 0) {
      adSetsData.forEach(adSetData => {
        this.createAdSet(newCampaign.id, adSetData);
      });
    }

    return newCampaign;
  }

  // Ad Set methods
  async getAdSets(campaignId: string): Promise<AdSetWithMetrics[]> {
    return adSets.filter(adSet => adSet.campaign_id === campaignId);
  }

  async getAdSetById(adSetId: string): Promise<AdSetWithMetrics | undefined> {
    return adSets.find(adSet => adSet.id === adSetId);
  }

  async createAdSet(campaignId: string, data: { 
    name: string; 
    dailyBudget: number; 
    targeting?: any;
    bid_strategy?: string;
  }): Promise<AdSetWithMetrics> {
    const newAdSet: AdSetWithMetrics = {
      id: Date.now().toString(),
      name: data.name,
      campaign_id: campaignId,
      daily_budget: data.dailyBudget,
      bid_strategy: (data.bid_strategy as any) || 'LOWEST_COST_WITHOUT_BID',
      status: 'ACTIVE',
      targeting: data.targeting || {},
      impressions: 0,
      clicks: 0,
      spend: 0
    };
    adSets.push(newAdSet);
    return newAdSet;
  }

  async updateAdSet(adSetId: string, updates: Partial<AdSetWithMetrics>): Promise<AdSetWithMetrics | null> {
    const index = adSets.findIndex(a => a.id === adSetId);
    if (index === -1) return null;
    adSets[index] = { ...adSets[index], ...updates };
    return adSets[index];
  }

  async deleteAdSet(adSetId: string): Promise<boolean> {
    const index = adSets.findIndex(a => a.id === adSetId);
    if (index === -1) return false;
    adSets.splice(index, 1);
    // Delete associated ads
    const adIndices = ads.map((a, i) => a.ad_set_id === adSetId ? i : -1).filter(i => i !== -1);
    adIndices.reverse().forEach(i => ads.splice(i, 1));
    return true;
  }

  // Ad methods
  async getAds(adSetId: string): Promise<AdWithMetrics[]> {
    return ads.filter(ad => ad.ad_set_id === adSetId);
  }

  async getAdById(adId: string): Promise<AdWithMetrics | undefined> {
    return ads.find(ad => ad.id === adId);
  }

  async createAd(adSetId: string, data: { 
    name: string; 
    creative: { body: string; image_url?: string; video_url?: string };
  }): Promise<AdWithMetrics> {
    const newAd: AdWithMetrics = {
      id: Date.now().toString(),
      ad_set_id: adSetId,
      name: data.name,
      status: 'IN_REVIEW',
      creative: data.creative,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0
    };
    ads.push(newAd);
    return newAd;
  }

  async updateAd(adId: string, updates: Partial<AdWithMetrics>): Promise<AdWithMetrics | null> {
    const index = ads.findIndex(a => a.id === adId);
    if (index === -1) return null;
    ads[index] = { ...ads[index], ...updates };
    return ads[index];
  }

  async deleteAd(adId: string): Promise<boolean> {
    const index = ads.findIndex(a => a.id === adId);
    if (index === -1) return false;
    ads.splice(index, 1);
    return true;
  }

  // Performance tracking methods
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) return null;

    const campaignAdSets = await this.getAdSets(campaignId);
    const allAds = await Promise.all(campaignAdSets.map(adSet => this.getAds(adSet.id))).then(results => results.flat());

    const dailyPerformance = this.generateDailyMetrics(campaign.totalImpressions, campaign.totalClicks, campaign.totalSpend);
    
    return {
      overview: {
        impressions: campaign.totalImpressions,
        clicks: campaign.totalClicks,
        spend: campaign.totalSpend,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        conversions: allAds.reduce((sum, ad) => sum + ad.conversions, 0)
      },
      adSets: campaignAdSets.map(adSet => ({
        id: adSet.id,
        name: adSet.name,
        impressions: adSet.impressions,
        clicks: adSet.clicks,
        spend: adSet.spend,
        ctr: adSet.impressions > 0 ? (adSet.clicks / adSet.impressions * 100).toFixed(2) : 0,
        cpc: adSet.clicks > 0 ? (adSet.spend / adSet.clicks).toFixed(2) : 0
      })),
      ads: allAds.map(ad => ({
        id: ad.id,
        name: ad.name,
        impressions: ad.impressions,
        clicks: ad.clicks,
        conversions: ad.conversions,
        spend: ad.spend,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions * 100).toFixed(2) : 0,
        cpc: ad.clicks > 0 ? (ad.spend / ad.clicks).toFixed(2) : 0
      })),
      dailyPerformance
    };
  }

  private generateDailyMetrics(totalImpressions: number, totalClicks: number, totalSpend: number): any[] {
    const days = 30;
    const dailyMetrics = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic daily numbers
      const impressions = Math.round(totalImpressions / days * (0.7 + Math.random() * 0.6));
      const clicks = Math.round(totalClicks / days * (0.7 + Math.random() * 0.6));
      const spend = Number((totalSpend / days * (0.7 + Math.random() * 0.6)).toFixed(2));
      
      dailyMetrics.push({
        date: date.toISOString().split('T')[0],
        impressions,
        clicks,
        spend,
        ctr: impressions > 0 ? Number((clicks / impressions * 100).toFixed(2)) : 0,
        cpc: clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0
      });
    }
    
    return dailyMetrics;
  }

  async trackImpression(adId: string, userId: string): Promise<void> {
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.impressions++;
      const adSet = adSets.find(a => a.id === ad.ad_set_id);
      if (adSet) {
        adSet.impressions++;
        const campaign = campaigns.find(c => c.id === adSet.campaign_id);
        if (campaign) {
          campaign.totalImpressions++;
          if (campaign.totalImpressions > 0) {
            campaign.ctr = Number((campaign.totalClicks / campaign.totalImpressions * 100).toFixed(2));
          }
        }
      }
    }
  }

  async trackClick(adId: string, userId: string): Promise<void> {
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.clicks++;
      const adSet = adSets.find(a => a.id === ad.ad_set_id);
      if (adSet) {
        adSet.clicks++;
        const campaign = campaigns.find(c => c.id === adSet.campaign_id);
        if (campaign) {
          campaign.totalClicks++;
          if (campaign.totalImpressions > 0) {
            campaign.ctr = Number((campaign.totalClicks / campaign.totalImpressions * 100).toFixed(2));
          }
          if (campaign.totalClicks > 0) {
            campaign.cpc = Number((campaign.totalSpend / campaign.totalClicks).toFixed(2));
          }
        }
      }
    }
  }

  async trackConversion(adId: string, value?: number): Promise<void> {
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.conversions++;
    }
  }
}