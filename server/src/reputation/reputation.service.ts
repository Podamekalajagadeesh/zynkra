import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reputation } from './entities/reputation.entity';
import { ReputationLog } from './entities/reputation-log.entity';
import { User } from '../users/entities/user.entity';
import { ReputationEvent } from './reputation.enum';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(Reputation)
    private readonly reputationRepository: Repository<Reputation>,
    @InjectRepository(ReputationLog)
    private readonly reputationLogRepository: Repository<ReputationLog>,
  ) {}

  private getPointsForEvent(event: ReputationEvent): number {
    switch (event) {
      case ReputationEvent.POST_CREATED:
        return 5;
      case ReputationEvent.POST_LIKED:
        return 1;
      case ReputationEvent.REPOST:
        return 3;
      case ReputationEvent.COMMENT_CREATED:
        return 2;
      case ReputationEvent.TIP_SENT:
        return 3;
      case ReputationEvent.TIP_RECEIVED:
        return 10;
      case ReputationEvent.PROPOSAL_CREATED:
        return 10;
      case ReputationEvent.VOTE_CAST:
        return 2;
      default:
        return 0;
    }
  }

  async getReputation(userId: string): Promise<Reputation | null> {
    return this.reputationRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'logs'],
    });
  }

  async addReputation(event: ReputationEvent, user: User): Promise<void> {
    let reputation = await this.reputationRepository.findOne({ where: { user: { id: user.id } } });
    if (!reputation) {
      reputation = this.reputationRepository.create({ user, score: 0 });
    }

    const points = this.getPointsForEvent(event);
    reputation.score += points;

    const log = this.reputationLogRepository.create({
      reputation,
      event,
      points,
    });

    await this.reputationRepository.save(reputation);
    await this.reputationLogRepository.save(log);
  }
}