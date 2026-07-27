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
export interface Donation {
  id: string;
  amount: number;
  message: string | null;
  donor: User;
  createdAt: string;
}

export interface Fundraiser {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  coverImageUrl: string | null;
  organizer: User;
  donations: Donation[];
  createdAt: string;
}

export interface DonationDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  endDate: string;
  goalAmount?: number;
  currentAmount?: number;
  imageUrl?: string;
  donations?: Donation[];
  createdAt: string;
}
