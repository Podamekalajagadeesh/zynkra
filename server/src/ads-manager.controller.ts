
import { AdsManagerService } from './ads-manager.service';

export class AdsManagerController {
  private readonly adsManagerService = new AdsManagerService();

  // Campaign endpoints
  async getCampaigns(req: any, res: any) {
    const userId = req.user?.id;
    const campaigns = await this.adsManagerService.getCampaigns(userId);
    res.json(campaigns);
  }

  async getCampaignById(req: any, res: any) {
    const { campaignId } = req.params;
    const campaign = await this.adsManagerService.getCampaignById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  }

  async createCampaign(req: any, res: any) {
    const userId = req.user?.id;
    const { name, objective, adSets, postId } = req.body;
    if (!name || !objective) {
      return res.status(400).json({ message: 'Name and objective are required' });
    }
    const campaign = await this.adsManagerService.createCampaign(userId, name, objective, adSets, postId);
    res.status(201).json(campaign);
  }

  async updateCampaign(req: any, res: any) {
    const { campaignId } = req.params;
    const updates = req.body;
    const campaign = await this.adsManagerService.updateCampaign(campaignId, updates);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  }

  async deleteCampaign(req: any, res: any) {
    const { campaignId } = req.params;
    const success = await this.adsManagerService.deleteCampaign(campaignId);
    if (!success) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  }

  async getCampaignPerformance(req: any, res: any) {
    const { campaignId } = req.params;
    const performance = await this.adsManagerService.getCampaignPerformance(campaignId);
    if (!performance) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(performance);
  }

  // Ad Set endpoints
  async getAdSets(req: any, res: any) {
    const { campaignId } = req.params;
    const adSets = await this.adsManagerService.getAdSets(campaignId);
    res.json(adSets);
  }

  async getAdSetById(req: any, res: any) {
    const { adSetId } = req.params;
    const adSet = await this.adsManagerService.getAdSetById(adSetId);
    if (!adSet) {
      return res.status(404).json({ message: 'Ad Set not found' });
    }
    res.json(adSet);
  }

  async createAdSet(req: any, res: any) {
    const { campaignId } = req.params;
    const { name, dailyBudget, targeting, bid_strategy } = req.body;
    if (!name || !dailyBudget) {
      return res.status(400).json({ message: 'Name and daily budget are required' });
    }
    const adSet = await this.adsManagerService.createAdSet(campaignId, { name, dailyBudget, targeting, bid_strategy });
    res.status(201).json(adSet);
  }

  async updateAdSet(req: any, res: any) {
    const { adSetId } = req.params;
    const updates = req.body;
    const adSet = await this.adsManagerService.updateAdSet(adSetId, updates);
    if (!adSet) {
      return res.status(404).json({ message: 'Ad Set not found' });
    }
    res.json(adSet);
  }

  async deleteAdSet(req: any, res: any) {
    const { adSetId } = req.params;
    const success = await this.adsManagerService.deleteAdSet(adSetId);
    if (!success) {
      return res.status(404).json({ message: 'Ad Set not found' });
    }
    res.json({ message: 'Ad Set deleted successfully' });
  }

  // Ad endpoints
  async getAds(req: any, res: any) {
    const { adSetId } = req.params;
    const ads = await this.adsManagerService.getAds(adSetId);
    res.json(ads);
  }

  async getAdById(req: any, res: any) {
    const { adId } = req.params;
    const ad = await this.adsManagerService.getAdById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.json(ad);
  }

  async createAd(req: any, res: any) {
    const { adSetId } = req.params;
    const { name, creative } = req.body;
    if (!name || !creative) {
      return res.status(400).json({ message: 'Name and creative are required' });
    }
    const ad = await this.adsManagerService.createAd(adSetId, { name, creative });
    res.status(201).json(ad);
  }

  async updateAd(req: any, res: any) {
    const { adId } = req.params;
    const updates = req.body;
    const ad = await this.adsManagerService.updateAd(adId, updates);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.json(ad);
  }

  async deleteAd(req: any, res: any) {
    const { adId } = req.params;
    const success = await this.adsManagerService.deleteAd(adId);
    if (!success) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.json({ message: 'Ad deleted successfully' });
  }

  // Tracking endpoints
  async trackImpression(req: any, res: any) {
    const { adId } = req.params;
    const userId = req.user?.id;
    await this.adsManagerService.trackImpression(adId, userId);
    res.status(204).send();
  }

  async trackClick(req: any, res: any) {
    const { adId } = req.params;
    const userId = req.user?.id;
    await this.adsManagerService.trackClick(adId, userId);
    res.status(204).send();
  }

  async trackConversion(req: any, res: any) {
    const { adId } = req.params;
    const { value } = req.body;
    await this.adsManagerService.trackConversion(adId, value);
    res.status(204).send();
  }
}