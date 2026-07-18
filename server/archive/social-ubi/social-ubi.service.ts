import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipationReward, ParticipationType } from './entities/participation-reward.entity';
import { UBIDisbursement } from './entities/ubi-disbursement.entity';

@Injectable()
export class SocialUBIService {
  constructor(
    @InjectRepository(ParticipationReward)
    private readonly rewardRepository: Repository<ParticipationReward>,
    @InjectRepository(UBIDisbursement)
    private readonly disbursementRepository: Repository<UBIDisbursement>,
  ) {}

  async createParticipationReward(
    userId: string,
    data: Partial<ParticipationReward>,
  ) {
    const reward = this.rewardRepository.create({
      ...data,
      userId,
    });
    return this.rewardRepository.save(reward);
  }

  async getUserParticipationRewards(userId: string) {
    return this.rewardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserTotalRewards(userId: string) {
    const rewards = await this.getUserParticipationRewards(userId);
    const disbursements = await this.getUserDisbursements(userId);
    const totalFromRewards = rewards.reduce((sum, r) => sum + r.amount, 0);
    const totalFromUBI = disbursements.reduce((sum, d) => sum + d.amount, 0);
    return totalFromRewards + totalFromUBI;
  }

  async createUBIDisbursement(
    userId: string,
    data: Partial<UBIDisbursement>,
  ) {
    const disbursement = this.disbursementRepository.create({
      ...data,
      userId,
    });
    return this.disbursementRepository.save(disbursement);
  }

  async getUserDisbursements(userId: string) {
    return this.disbursementRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(userId?: string) {
    if (userId) {
      return {
        user: {
          totalRewards: await this.getUserTotalRewards(userId),
          participationRewards: await this.getUserParticipationRewards(userId),
          disbursements: await this.getUserDisbursements(userId),
        },
      };
    }
    const totalRewards = await this.rewardRepository.sum('amount');
    const totalDisbursements = await this.disbursementRepository.sum('amount');
    return {
      global: {
        totalRewards: totalRewards || 0,
        totalDisbursements: totalDisbursements || 0,
      },
    };
  }
}
