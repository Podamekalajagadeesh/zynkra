import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** Presence for a set of users, honoring each user's privacy settings. */
  async getUsersStatuses(userIds: string[]) {
    if (userIds.length === 0) return [];
    const users = await this.usersRepository.find({ where: { id: In(userIds) } });
    return users.map((user) => ({
      userId: user.id,
      isOnline: user.showOnlineStatus ? user.isOnline : undefined,
      lastSeenAt: user.showLastSeenTimestamp ? user.lastSeenAt : undefined,
    }));
  }

  async getActivitySettings(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return {
      showOnlineStatus: user.showOnlineStatus,
      showLastSeenTimestamp: user.showLastSeenTimestamp,
    };
  }

  async updateActivitySettings(
    userId: string,
    settings: { showOnlineStatus?: boolean; showLastSeenTimestamp?: boolean },
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (settings.showOnlineStatus !== undefined) {
      user.showOnlineStatus = settings.showOnlineStatus;
    }
    if (settings.showLastSeenTimestamp !== undefined) {
      user.showLastSeenTimestamp = settings.showLastSeenTimestamp;
    }
    await this.usersRepository.save(user);
    return this.getActivitySettings(userId);
  }
}
