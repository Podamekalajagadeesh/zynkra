import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

export enum DataPermission {
  PROFILE = 'profile',
  POSTS = 'posts',
  MESSAGES = 'messages',
  PERSONALIZATION = 'personalization',
  ANALYTICS = 'analytics',
  CONNECTED_SERVICES = 'connected_services',
  SETTINGS = 'settings',
}

export class UpdateDataPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(DataPermission, { each: true })
  dataPermissions: DataPermission[];
}