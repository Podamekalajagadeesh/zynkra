import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DataType {
  PROFILE = 'profile',
  POSTS = 'posts',
  MESSAGES = 'messages',
  MEDIA = 'media',
  COMMENTS = 'comments',
  LIKES = 'likes',
  BOOKMARKS = 'bookmarks',
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
  STORIES = 'stories',
  COLLECTIONS = 'collections',
  PREFERENCES = 'preferences',
  SETTINGS = 'settings',
  ACTIVITY = 'activity',
  ANALYTICS = 'analytics',
  CONNECTED_ACCOUNTS = 'connected_accounts',
  PAYMENT_INFO = 'payment_info',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  ZIP = 'zip',
}

export class RequestDataDownloadDto {
  @IsArray()
  @IsEnum(DataType, { each: true })
  @IsOptional()
  dataTypes?: DataType[];

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;
}

export class RequestDataDeletionDto {
  @IsArray()
  @IsEnum(DataType, { each: true })
  dataTypes: DataType[];

  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;
}

export class DataDownloadResponseDto {
  accountId: string;
  downloadId: string;
  status: 'processing' | 'ready' | 'failed';
  downloadUrl?: string;
  expiresAt: string;
  dataTypes: DataType[];
  sizeBytes?: number;
  createdAt: string;
}

export class DataDeletionResponseDto {
  accountId: string;
  deletionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  dataTypes: DataType[];
  scheduledFor?: string;
  completedAt?: string;
  reason: string;
  createdAt: string;
}

export class DataManagementPreferencesDto {
  @IsArray()
  @IsEnum(DataType, { each: true })
  @IsOptional()
  allowedDataTypes?: DataType[];

  @IsArray()
  @IsEnum(DataType, { each: true })
  @IsOptional()
  restrictedDataTypes?: DataType[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dataRetentionDays?: string;

  @IsOptional()
  autoDeleteAfterDays?: number;
}
