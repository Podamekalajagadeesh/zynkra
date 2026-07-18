import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HarmPreventionLog, HarmType, ActionTaken } from './entities/harm-prevention-log.entity';
import { UserHarmPreferences } from './entities/user-harm-preferences.entity';

@Injectable()
export class NeuralHarmPreventionService {
  constructor(
    @InjectRepository(HarmPreventionLog)
    private readonly logRepository: Repository<HarmPreventionLog>,
    @InjectRepository(UserHarmPreferences)
    private readonly preferencesRepository: Repository<UserHarmPreferences>,
  ) {}

  async getUserPreferences(userId: string) {
    let prefs = await this.preferencesRepository.findOne({
      where: { userId },
    });
    if (!prefs) {
      prefs = this.preferencesRepository.create({ userId });
      return this.preferencesRepository.save(prefs);
    }
    return prefs;
  }

  async updatePreferences(userId: string, data: Partial<UserHarmPreferences>) {
    let prefs = await this.preferencesRepository.findOne({
      where: { userId },
    });
    if (!prefs) {
      prefs = this.preferencesRepository.create({ userId, ...data });
    } else {
      Object.assign(prefs, data);
    }
    return this.preferencesRepository.save(prefs);
  }

  async checkContentForHarm(
    userId: string | undefined,
    contentId: string,
    contentMetadata: any,
  ) {
    const preferences = userId ? await this.getUserPreferences(userId) : null;
    let riskScore = 0;
    let harmType = HarmType.UNKNOWN;

    // Simulate risk detection
    if (contentMetadata.hasRapidFlashing) {
      riskScore = 0.85;
      harmType = HarmType.SEIZURE_RISK;
    } else if (contentMetadata.hasHighEmotionalDistress) {
      riskScore = 0.75;
      harmType = HarmType.EMOTIONAL_DISTRESS;
    }

    let action = ActionTaken.NOTHING;
    if (riskScore > 0.7) {
      if (preferences?.seizureRiskBlocked && harmType === HarmType.SEIZURE_RISK) {
        action = ActionTaken.BLOCKED;
      } else if (preferences?.emotionalDistressBlocked && harmType === HarmType.EMOTIONAL_DISTRESS) {
        action = ActionTaken.WARNED;
      }
    }

    // Log the check
    const log = this.logRepository.create({
      userId,
      contentId,
      harmType,
      riskScore,
      action,
      contentMetadata,
    });
    await this.logRepository.save(log);

    return { safe: action === ActionTaken.NOTHING, riskScore, harmType, action };
  }

  async getUserLogs(userId: string, limit: number = 100) {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllLogs(limit: number = 100) {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getStats() {
    const total = await this.logRepository.count();
    const blocked = await this.logRepository.count({ where: { action: ActionTaken.BLOCKED } });
    const warned = await this.logRepository.count({ where: { action: ActionTaken.WARNED } });
    const seizure = await this.logRepository.count({ where: { harmType: HarmType.SEIZURE_RISK } });
    const distress = await this.logRepository.count({ where: { harmType: HarmType.EMOTIONAL_DISTRESS } });

    return { total, blocked, warned, seizure, distress };
  }
}
