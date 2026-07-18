import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MindfulnessSetting, FilterIntensity } from './entities/mindfulness-setting.entity';
import { UsageSession, SessionType } from './entities/usage-session.entity';

@Injectable()
export class MindfulnessService {
  constructor(
    @InjectRepository(MindfulnessSetting)
    private readonly settingRepository: Repository<MindfulnessSetting>,
    @InjectRepository(UsageSession)
    private readonly sessionRepository: Repository<UsageSession>,
  ) {}

  async getUserSetting(userId: string) {
    let setting = await this.settingRepository.findOne({ where: { userId } });
    if (!setting) {
      setting = this.settingRepository.create({ userId });
      return this.settingRepository.save(setting);
    }
    return setting;
  }

  async updateSetting(userId: string, data: Partial<MindfulnessSetting>) {
    let setting = await this.settingRepository.findOne({ where: { userId } });
    if (!setting) {
      setting = this.settingRepository.create({ userId, ...data });
    } else {
      Object.assign(setting, data);
    }
    return this.settingRepository.save(setting);
  }

  async startSession(userId: string, sessionType: SessionType, contentTypes?: string[]) {
    const session = this.sessionRepository.create({
      userId,
      sessionType,
      startTime: new Date(),
      contentTypes,
    });
    return this.sessionRepository.save(session);
  }

  async endSession(sessionId: string, stressLevel?: number) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) return null;

    session.endTime = new Date();
    session.durationSeconds = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
    if (stressLevel !== undefined) {
      session.stressLevel = stressLevel;
    }
    return this.sessionRepository.save(session);
  }

  async getTodayUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const todaySessions = sessions.filter(s => s.startTime >= today && s.startTime < tomorrow);
    const totalDuration = todaySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

    return {
      totalDuration,
      sessions: todaySessions,
      count: todaySessions.length,
    };
  }

  async checkTimeLimit(userId: string, sessionId?: string) {
    const setting = await this.getUserSetting(userId);
    if (!setting.enabled) return { allowed: true };

    const todayUsage = await this.getTodayUsage(userId);
    const limitSeconds = setting.dailyTimeLimit * 60;

    if (todayUsage.totalDuration >= limitSeconds) {
      if (sessionId) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (session) {
          session.limitReached = true;
          await this.sessionRepository.save(session);
        }
      }
      return { allowed: false, reason: 'daily_limit_reached', remaining: 0 };
    }

    return {
      allowed: true,
      remaining: limitSeconds - todayUsage.totalDuration,
    };
  }

  async checkSessionDuration(sessionId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) return { allowed: true };

    const setting = await this.getUserSetting(session.userId);
    if (!setting.enabled) return { allowed: true };

    const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    const limit = setting.maxSessionDuration * 60;

    if (elapsed >= limit && !session.breakReminded) {
      session.breakReminded = true;
      await this.sessionRepository.save(session);
      return { allowed: false, reason: 'session_limit_reached', elapsed };
    }

    return { allowed: true, elapsed, limit };
  }

  async getStats(userId: string) {
    const setting = await this.getUserSetting(userId);
    const todayUsage = await this.getTodayUsage(userId);

    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const sessions = await this.sessionRepository.find({
        where: { userId },
      });

      const daySessions = sessions.filter(s => s.startTime >= date && s.startTime < nextDay);
      const totalDuration = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

      last7Days.unshift({
        date: date.toISOString().split('T')[0],
        duration: totalDuration,
        count: daySessions.length,
      });
    }

    return {
      setting,
      today: todayUsage,
      last7Days,
    };
  }
}
