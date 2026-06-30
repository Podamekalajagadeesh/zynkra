export class FederatePostDto {
  activityId: string;
  content: string;
  inReplyToId?: string;
  mediaUrls?: string[];
  mentions?: string[];
  tags?: string[];
  publishedAt: Date;
  to?: string[];
  cc?: string[];
}

export class FederateFollowDto {
  objectId: string;
  targetInstance: string;
}

export class FederateLikeDto {
  postId: string;
  targetInstance: string;
}

export class FederateAnnounceDto {
  postId: string;
  targetInstances: string[];
}