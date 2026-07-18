import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeuralStateLog, EmotionalState } from './entities/neural-state-log.entity';
import { WellbeingSuggestion, SuggestionType, SuggestionStatus } from './entities/wellbeing-suggestion.entity';

const SUGGESTIONS = [
  {
    type: SuggestionType.BREAK,
    title: 'Take a 5-minute break',
    description: 'Step away from the screen, stretch, and take deep breaths',
    duration: 5,
  },
  {
    type: SuggestionType.RELAXATION,
    title: 'Try a quick meditation',
    description: 'Focus on your breathing for 3 minutes',
    duration: 3,
  },
  {
    type: SuggestionType.EXERCISE,
    title: 'Quick movement exercise',
    description: 'Stand up and do 20 seconds of jumping jacks',
    duration: 1,
  },
  {
    type: SuggestionType.DISCONNECT,
    title: 'Digital detox for 10 minutes',
    description: 'Put away all devices and relax',
    duration: 10,
  },
];

@Injectable()
export class NeuralWellbeingService {
  constructor(
    @InjectRepository(NeuralStateLog)
    private readonly logRepository: Repository<NeuralStateLog>,
    @InjectRepository(WellbeingSuggestion)
    private readonly suggestionRepository: Repository<WellbeingSuggestion>,
  ) {}

  async logNeuralState(
    userId: string,
    data: {
      stressLevel: number;
      anxietyLevel: number;
      engagementLevel: number;
      emotionalState: EmotionalState;
      rawNeuralData?: any;
    },
  ) {
    const log = this.logRepository.create({ ...data, userId });
    const saved = await this.logRepository.save(log);

    // Automatically check if we need to generate a suggestion
    if (data.stressLevel > 0.7 || data.anxietyLevel > 0.7) {
      await this.generateSuggestion(userId, {
        stressLevel: data.stressLevel,
        anxietyLevel: data.anxietyLevel,
      });
    }

    return saved;
  }

  async getUserLogs(userId: string, limit: number = 100) {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async generateSuggestion(userId: string, triggerData?: any) {
    const randomSuggestion = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    const suggestion = this.suggestionRepository.create({
      userId,
      type: randomSuggestion.type,
      title: randomSuggestion.title,
      description: randomSuggestion.description,
      durationMinutes: randomSuggestion.duration,
      triggeredBy: triggerData,
    });
    return this.suggestionRepository.save(suggestion);
  }

  async getUserSuggestions(userId: string, status?: SuggestionStatus) {
    const where = status ? { userId, status } : { userId };
    return this.suggestionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async updateSuggestionStatus(
    suggestionId: string,
    userId: string,
    status: SuggestionStatus,
  ) {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id: suggestionId, userId },
    });
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }
    suggestion.status = status;
    if (status === SuggestionStatus.COMPLETED) {
      suggestion.completedAt = new Date();
    }
    return this.suggestionRepository.save(suggestion);
  }

  async getWellbeingStats(userId: string) {
    const [logs, suggestions] = await Promise.all([
      this.getUserLogs(userId, 1000),
      this.getUserSuggestions(userId),
    ]);

    const avgStress = logs.length > 0 ? logs.reduce((sum, l) => sum + l.stressLevel, 0) / logs.length : 0;
    const avgAnxiety = logs.length > 0 ? logs.reduce((sum, l) => sum + l.anxietyLevel, 0) / logs.length : 0;
    const completedSuggestions = suggestions.filter((s) => s.status === SuggestionStatus.COMPLETED).length;

    return {
      totalLogs: logs.length,
      averageStress: avgStress,
      averageAnxiety: avgAnxiety,
      totalSuggestions: suggestions.length,
      completedSuggestions,
    };
  }
}
