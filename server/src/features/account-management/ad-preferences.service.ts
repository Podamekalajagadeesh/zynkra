import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export interface AdPreferences {
  accountId: string;
  adTargeting: 'disabled' | 'basic' | 'personalized' | 'advanced';
  personalizedAds: boolean;
  thirdPartyAds: boolean;
  affiliateAds: boolean;
  allowCrossSiteTracking: boolean;
  preferredCategories: string[];
  blockedCategories: string[];
  blockedAdvertisers: string[];
  showAds: boolean;
  adFrequency: 'high' | 'medium' | 'low' | 'minimal';
  updatedAt: Date;
}

@Injectable()
export class AdPreferencesService {
  private readonly adPreferences = new Map<string, AdPreferences>();

  /**
   * Get ad preferences for an account
   */
  async getAdPreferences(accountId: string): Promise<AdPreferences> {
    let prefs = this.adPreferences.get(accountId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(accountId);
      this.adPreferences.set(accountId, prefs);
    }

    return prefs;
  }

  /**
   * Update ad preferences
   */
  async updateAdPreferences(
    accountId: string,
    updates: Partial<AdPreferences>,
  ): Promise<AdPreferences> {
    let prefs = this.adPreferences.get(accountId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(accountId);
    }

    // Validate conflicting settings
    if (updates.adTargeting === 'disabled' && (updates.personalizedAds || updates.affiliateAds)) {
      throw new BadRequestException('Cannot enable ads when ad targeting is disabled');
    }

    // Update preferences
    if (updates.adTargeting !== undefined) prefs.adTargeting = updates.adTargeting;
    if (updates.personalizedAds !== undefined) prefs.personalizedAds = updates.personalizedAds;
    if (updates.thirdPartyAds !== undefined) prefs.thirdPartyAds = updates.thirdPartyAds;
    if (updates.affiliateAds !== undefined) prefs.affiliateAds = updates.affiliateAds;
    if (updates.allowCrossSiteTracking !== undefined) prefs.allowCrossSiteTracking = updates.allowCrossSiteTracking;
    if (updates.preferredCategories !== undefined) prefs.preferredCategories = updates.preferredCategories;
    if (updates.blockedCategories !== undefined) prefs.blockedCategories = updates.blockedCategories;
    if (updates.blockedAdvertisers !== undefined) prefs.blockedAdvertisers = updates.blockedAdvertisers;
    if (updates.showAds !== undefined) prefs.showAds = updates.showAds;
    if (updates.adFrequency !== undefined) prefs.adFrequency = updates.adFrequency;

    prefs.updatedAt = new Date();

    this.adPreferences.set(accountId, prefs);

    return prefs;
  }

  /**
   * Block an advertiser
   */
  async blockAdvertiser(accountId: string, advertiserId: string): Promise<{ success: boolean; blockedAdvertisers: string[] }> {
    const prefs = await this.getAdPreferences(accountId);

    if (!prefs.blockedAdvertisers.includes(advertiserId)) {
      prefs.blockedAdvertisers.push(advertiserId);
      prefs.updatedAt = new Date();
    }

    return { success: true, blockedAdvertisers: prefs.blockedAdvertisers };
  }

  /**
   * Unblock an advertiser
   */
  async unblockAdvertiser(accountId: string, advertiserId: string): Promise<{ success: boolean; blockedAdvertisers: string[] }> {
    const prefs = await this.getAdPreferences(accountId);

    const index = prefs.blockedAdvertisers.indexOf(advertiserId);
    if (index > -1) {
      prefs.blockedAdvertisers.splice(index, 1);
      prefs.updatedAt = new Date();
    }

    return { success: true, blockedAdvertisers: prefs.blockedAdvertisers };
  }

  /**
   * Get list of blocked advertisers
   */
  async getBlockedAdvertisers(accountId: string): Promise<string[]> {
    const prefs = await this.getAdPreferences(accountId);
    return prefs.blockedAdvertisers;
  }

  /**
   * Set preferred ad categories
   */
  async setPreferredCategories(
    accountId: string,
    categories: string[],
  ): Promise<{ success: boolean; preferredCategories: string[] }> {
    const prefs = await this.getAdPreferences(accountId);

    prefs.preferredCategories = categories;
    prefs.updatedAt = new Date();

    return { success: true, preferredCategories: prefs.preferredCategories };
  }

  /**
   * Set blocked ad categories
   */
  async setBlockedCategories(
    accountId: string,
    categories: string[],
  ): Promise<{ success: boolean; blockedCategories: string[] }> {
    const prefs = await this.getAdPreferences(accountId);

    prefs.blockedCategories = categories;
    prefs.updatedAt = new Date();

    return { success: true, blockedCategories: prefs.blockedCategories };
  }

  /**
   * Set ad frequency
   */
  async setAdFrequency(
    accountId: string,
    frequency: 'high' | 'medium' | 'low' | 'minimal',
  ): Promise<{ success: boolean; adFrequency: string }> {
    const prefs = await this.getAdPreferences(accountId);

    prefs.adFrequency = frequency;
    prefs.updatedAt = new Date();

    return { success: true, adFrequency: prefs.adFrequency };
  }

  /**
   * Toggle cross-site tracking
   */
  async toggleCrossSiteTracking(accountId: string, enabled: boolean): Promise<{ success: boolean; allowCrossSiteTracking: boolean }> {
    const prefs = await this.getAdPreferences(accountId);

    prefs.allowCrossSiteTracking = enabled;
    prefs.updatedAt = new Date();

    return { success: true, allowCrossSiteTracking: prefs.allowCrossSiteTracking };
  }

  /**
   * Get ad targeting level
   */
  async getAdTargetingLevel(accountId: string): Promise<string> {
    const prefs = await this.getAdPreferences(accountId);
    return prefs.adTargeting;
  }

  /**
   * Set ad targeting level
   */
  async setAdTargetingLevel(
    accountId: string,
    level: 'disabled' | 'basic' | 'personalized' | 'advanced',
  ): Promise<{ success: boolean; adTargeting: string }> {
    const prefs = await this.getAdPreferences(accountId);

    prefs.adTargeting = level;
    prefs.updatedAt = new Date();

    return { success: true, adTargeting: prefs.adTargeting };
  }

  /**
   * Clear all ad preferences (reset to default)
   */
  async resetAdPreferences(accountId: string): Promise<AdPreferences> {
    const defaultPrefs = this.createDefaultPreferences(accountId);
    this.adPreferences.set(accountId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Export ad preferences
   */
  async exportAdPreferences(accountId: string): Promise<AdPreferences> {
    return this.getAdPreferences(accountId);
  }

  /**
   * Bulk update ad preferences
   */
  async bulkUpdateAdPreferences(
    accountId: string,
    updates: Partial<AdPreferences>,
  ): Promise<{ success: boolean; updatedPreferences: AdPreferences }> {
    const prefs = await this.updateAdPreferences(accountId, updates);
    return { success: true, updatedPreferences: prefs };
  }

  private createDefaultPreferences(accountId: string): AdPreferences {
    return {
      accountId,
      adTargeting: 'personalized',
      personalizedAds: true,
      thirdPartyAds: true,
      affiliateAds: false,
      allowCrossSiteTracking: false,
      preferredCategories: [],
      blockedCategories: [],
      blockedAdvertisers: [],
      showAds: true,
      adFrequency: 'medium',
      updatedAt: new Date(),
    };
  }
}
