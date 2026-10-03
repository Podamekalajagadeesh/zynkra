import { Injectable, Logger } from '@nestjs/common';

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  username?: string;
  displayName?: string;
  avatar?: string;
}

export interface LocationPrivacy {
  userId: string;
  shareWith: 'all_friends' | 'selected_friends' | 'no_one';
  selectedFriendIds: string[];
  ghostMode: boolean;
  expireAfter: string;
  expiresAt: Date;
}

/**
 * In-process store for shared user locations.
 *
 * This exists as its own service because `FeedService.getLocalFeed` used to
 * reach into `SnapMapGateway`'s **private** `userLocations` map through a
 * `@ts-expect-error`. That coupling meant renaming or reshaping the private
 * field silently broke the local feed at runtime, with no compile-time signal.
 *
 * The gateway now owns the socket plumbing and delegates storage here, and
 * `FeedService` depends on this service instead.
 *
 * NOTE: this is still in-process state, so locations do not survive a restart
 * and are not shared across instances. It is a Preview feature (ROADMAP §2/§6);
 * persisting to the database is the eventual fix.
 */
@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly userLocations = new Map<string, UserLocation>();
  private readonly locationPrivacy = new Map<string, LocationPrivacy>();

  setLocation(userId: string, latitude: number, longitude: number): UserLocation {
    const location: UserLocation = {
      userId,
      latitude,
      longitude,
      lastUpdated: new Date(),
    };
    this.userLocations.set(userId, location);
    return location;
  }

  getLocation(userId: string): UserLocation | undefined {
    return this.userLocations.get(userId);
  }

  clearLocation(userId: string): void {
    this.userLocations.delete(userId);
  }

  setPrivacy(
    userId: string,
    settings: Omit<LocationPrivacy, 'userId' | 'expiresAt'>,
  ): LocationPrivacy {
    const privacy: LocationPrivacy = {
      ...settings,
      userId,
      selectedFriendIds: settings.selectedFriendIds ?? [],
      expiresAt: this.calculateExpiration(settings.expireAfter),
    };
    this.locationPrivacy.set(userId, privacy);
    this.logger.debug(`Updated location privacy for user: ${userId}`);
    return privacy;
  }

  getPrivacy(userId: string): LocationPrivacy | undefined {
    return this.locationPrivacy.get(userId);
  }

  /** Every currently stored location, for the caller's own filtering. */
  allLocations(): Map<string, UserLocation> {
    return this.userLocations;
  }

  /**
   * Whether `viewerId` may see `ownerId`'s location. Ghost mode and expiry are
   * honoured, and a user with no explicit privacy setting defaults to sharing
   * with accepted followers.
   */
  canViewLocation(ownerId: string, viewerId: string): boolean {
    const privacy = this.locationPrivacy.get(ownerId);
    if (!privacy) return true;
    if (privacy.ghostMode) return false;
    if (privacy.shareWith === 'no_one') return false;
    if (privacy.shareWith === 'selected_friends' && !privacy.selectedFriendIds.includes(viewerId)) {
      return false;
    }
    if (new Date() > privacy.expiresAt) return false;
    return true;
  }

  calculateExpiration(expireAfter: string): Date {
    const now = new Date();
    switch (expireAfter) {
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '4hours':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case '24hours':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
  }
}
