export enum ProfilePrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum GroupPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SECRET = 'secret',
}

export enum AccountType {
  PERSONAL = 'personal',
  CREATOR = 'creator',
  BUSINESS = 'business',
}

export interface User {
  id: string;
  email: string | null;
  walletAddress: string | null;
  profilePrivacy: ProfilePrivacy;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  website: string[] | null;
  accountType: AccountType;
  verified: boolean;
  profileThemeColor: string | null;
  profileTheme: string | null;
  profileHeaderImageUrl: string | null;
}