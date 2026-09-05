import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { VisibilityService } from '../common/visibility/visibility.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly visibilityService: VisibilityService,
  ) {}

  /** Presence for a set of users, honoring each user's privacy settings. */
  async getUsersStatuses(userIds: string[], viewerId: string | null) {
    if (userIds.length === 0) return [];
    const users = await this.usersRepository.find({ where: { id: In(userIds) } });
    return Promise.all(users.map(async (user) => {
      const canView = await this.visibilityService.canViewActivity(viewerId, user);
      return {
        userId: user.id,
        isOnline: canView && user.showOnlineStatus ? user.isOnline : undefined,
        lastSeenAt: canView && user.showLastSeenTimestamp ? user.lastSeenAt : undefined,
      };
    }));
  }

  async getActivitySettings(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return {
      showOnlineStatus: user.showOnlineStatus,
      showLastSeenTimestamp: user.showLastSeenTimestamp,
      readReceipts: user.readReceipts,
      mentions: user.mentions,
      activityVisibility: user.activityVisibility,
      contactDiscovery: user.contactDiscovery,
      personalization: user.personalization,
      adPersonalization: user.adPersonalization,
    };
  }

  async updateActivitySettings(
    userId: string,
    settings: {
      showOnlineStatus?: boolean;
      showLastSeenTimestamp?: boolean;
      readReceipts?: boolean;
      mentions?: 'everyone' | 'followers' | 'no_one';
      activityVisibility?: 'public' | 'friends' | 'private';
      contactDiscovery?: boolean;
      personalization?: boolean;
      adPersonalization?: boolean;
    },
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (settings.showOnlineStatus !== undefined) {
      user.showOnlineStatus = settings.showOnlineStatus;
    }
    if (settings.showLastSeenTimestamp !== undefined) {
      user.showLastSeenTimestamp = settings.showLastSeenTimestamp;
    }
    if (settings.readReceipts !== undefined) {
      user.readReceipts = settings.readReceipts;
    }
    if (settings.mentions) {
      user.mentions = settings.mentions;
    }
    if (settings.activityVisibility) {
      user.activityVisibility = settings.activityVisibility;
    }
    if (settings.contactDiscovery !== undefined) {
      user.contactDiscovery = settings.contactDiscovery;
    }
    if (settings.personalization !== undefined) {
      user.personalization = settings.personalization;
    }
    if (settings.adPersonalization !== undefined) {
      user.adPersonalization = settings.adPersonalization;
    }
    await this.usersRepository.save(user);
    return this.getActivitySettings(userId);
  }
}
