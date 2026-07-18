import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeuralPrivacySetting, NeuralContentType, AccessLevel } from './entities/neural-privacy-setting.entity';
import { NeuralAccessLog, AccessAction } from './entities/neural-access-log.entity';

@Injectable()
export class NeuralPrivacyService {
  constructor(
    @InjectRepository(NeuralPrivacySetting)
    private readonly settingRepository: Repository<NeuralPrivacySetting>,
    @InjectRepository(NeuralAccessLog)
    private readonly logRepository: Repository<NeuralAccessLog>,
  ) {}

  async getUserSettings(userId: string) {
    return this.settingRepository.find({ where: { userId } });
  }

  async updateSetting(
    userId: string,
    contentType: NeuralContentType,
    data: Partial<NeuralPrivacySetting>,
  ) {
    let setting = await this.settingRepository.findOne({
      where: { userId, contentType },
    });

    if (!setting) {
      setting = this.settingRepository.create({ userId, contentType });
    }

    Object.assign(setting, data);
    const saved = await this.settingRepository.save(setting);

    const log = this.logRepository.create({
      userId,
      action: AccessAction.GRANT,
      contentType,
      details: `Updated privacy settings for ${contentType}`,
    });
    await this.logRepository.save(log);

    return saved;
  }

  async grantTempAccess(
    userId: string,
    contentType: NeuralContentType,
    allowedUserIds: string[],
    durationHours: number,
  ) {
    const tempAccessStart = new Date();
    const tempAccessEnd = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await this.updateSetting(userId, contentType, {
      tempAccessEnabled: true,
      tempAccessStart,
      tempAccessEnd,
      tempAccessAllowedUserIds: allowedUserIds,
    });

    return { tempAccessStart, tempAccessEnd };
  }

  async revokeTempAccess(userId: string, contentType: NeuralContentType) {
    return this.updateSetting(userId, contentType, {
      tempAccessEnabled: false,
      tempAccessStart: null,
      tempAccessEnd: null,
      tempAccessAllowedUserIds: [],
    });
  }

  async getAccessLogs(userId: string) {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['accessingUser'],
    });
  }

  async checkAccess(
    ownerId: string,
    accessingUserId: string,
    contentType: NeuralContentType,
  ): Promise<boolean> {
    if (ownerId === accessingUserId) return true;

    const setting = await this.settingRepository.findOne({
      where: { userId: ownerId, contentType },
    });

    if (!setting) return false;

    if (setting.tempAccessEnabled && setting.tempAccessEnd && new Date() < setting.tempAccessEnd) {
      if (setting.tempAccessAllowedUserIds?.includes(accessingUserId)) {
        return true;
      }
    }

    switch (setting.accessLevel) {
      case AccessLevel.PUBLIC:
        return true;
      case AccessLevel.PRIVATE:
        return false;
      case AccessLevel.CONNECTIONS:
        // TODO: Check if accessing user is a connection
        return false;
      case AccessLevel.FRIENDS:
        // TODO: Check if accessing user is a friend
        return false;
      default:
        return false;
    }
  }

  async logAccess(
    userId: string,
    accessingUserId: string | undefined,
    action: AccessAction,
    contentType?: string,
  ) {
    const log = this.logRepository.create({
      userId,
      accessingUserId,
      action,
      contentType,
    });
    return this.logRepository.save(log);
  }
}
