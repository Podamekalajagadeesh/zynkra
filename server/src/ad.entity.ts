
export class Ad {
  id: string;
  ad_set_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'IN_REVIEW' | 'DISAPPROVED';
  creative: {
    body: string;
    image_url?: string;
    video_url?: string;
  };
}