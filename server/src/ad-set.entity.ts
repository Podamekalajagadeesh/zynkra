
export class AdSet {
  id: string;
  name: string;
  campaign_id: string;
  daily_budget: number;
  bid_strategy: 'LOWEST_COST_WITH_BID_CAP' | 'LOWEST_COST_WITHOUT_BID' | 'COST_CAP';
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}