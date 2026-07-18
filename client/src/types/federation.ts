export interface RemoteInstanceDto {
  id: string;
  domain: string;
  name: string;
  description?: string;
  baseUrl: string;
  software?: string;
  version?: string;
  isVerified: boolean;
  lastSyncAt?: Date;
  isBlocked?: boolean;
}

export interface ConnectInstanceDto {
  domain: string;
  baseUrl: string;
}

export interface RemoteUserDto {
  id: string;
  actorId: string;
  username: string;
  name?: string;
  summary?: string;
  avatarUrl?: string;
  headerUrl?: string;
  instance: RemoteInstanceDto;
  isActive: boolean;
}

export interface RemotePostDto {
  id: string;
  activityId: string;
  activityType: string;
  content: string;
  inReplyToId?: string;
  author: RemoteUserDto;
  instance: RemoteInstanceDto;
  mediaUrls?: string[];
  mentions?: string[];
  tags?: string[];
  likeCount: number;
  shareCount: number;
  publishedAt: Date;
}

export interface FederationStatsDto {
  totalInstances: number;
  activeInstances: number;
  totalRemoteUsers: number;
  totalRemotePosts: number;
  localDomain: string;
  localBaseUrl: string;
}