
export class Campaign {
  id: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  special_ad_categories: string[];
}