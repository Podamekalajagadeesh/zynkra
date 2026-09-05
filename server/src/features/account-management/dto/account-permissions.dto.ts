import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

export enum AccountPermission {
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',
  POSTS_READ = 'posts:read',
  POSTS_WRITE = 'posts:write',
  MESSAGES_READ = 'messages:read',
  MESSAGES_WRITE = 'messages:write',
  DATA_EXPORT = 'data:export',
  ACCOUNT_SETTINGS = 'account:settings',
}

export class UpdateAccountPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(AccountPermission, { each: true })
  permissions: AccountPermission[];
}