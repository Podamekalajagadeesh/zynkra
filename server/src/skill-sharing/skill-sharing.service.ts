import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillCommunity, SkillCommunityMember, SkillExchange } from './entities/skill-community.entity';
import { buildImmersiveLearningSession } from './immersive-learning';

@Injectable()
export class SkillSharingService {
  constructor(
    @InjectRepository(SkillCommunity)
    private readonly communityRepository: Repository<SkillCommunity>,
    @InjectRepository(SkillCommunityMember)
    private readonly memberRepository: Repository<SkillCommunityMember>,
    @InjectRepository(SkillExchange)
    private readonly exchangeRepository: Repository<SkillExchange>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Tech Skills Exchange',
          description: 'Share coding, design, and tech skills with each other',
          skills: ['JavaScript', 'Python', 'Design', 'UI/UX'],
        },
        {
          name: 'Art & Creative Exchange',
          description: 'Trade creative skills like painting, music, writing',
          skills: ['Painting', 'Music', 'Writing', 'Photography'],
        },
        {
          name: 'Everyday Life Skills',
          description: 'Learn practical skills like cooking, gardening, DIY',
          skills: ['Cooking', 'Gardening', 'DIY', 'Carpentry'],
        },
      ];
      for (const commData of defaultCommunities) {
        const comm = this.communityRepository.create(commData);
        await this.communityRepository.save(comm);
      }
    }
  }

  async getAllCommunities() {
    return this.communityRepository.find({
      order: { memberCount: 'DESC', createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getCommunityById(id: string) {
    const comm = await this.communityRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!comm) throw new NotFoundException('Community not found');
    return comm;
  }

  async createCommunity(data: Partial<SkillCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
    data: {
      offeringSkills?: string[];
      seekingSkills?: string[];
    },
  ) {
    const existing = await this.memberRepository.findOne({
      where: { communityId, userId },
    });
    if (existing) return existing;

    const member = this.memberRepository.create({ ...data, communityId, userId });
    const saved = await this.memberRepository.save(member);
    await this.communityRepository.increment({ id: communityId }, 'memberCount', 1);
    return saved;
  }

  async leaveCommunity(communityId: string, userId: string) {
    const result = await this.memberRepository.delete({ communityId, userId });
    if (result.affected) {
      await this.communityRepository.decrement({ id: communityId }, 'memberCount', 1);
    }
    return result;
  }

  async getUserMemberships(userId: string) {
    return this.memberRepository.find({
      where: { userId },
      relations: ['community'],
    });
  }

  async getCommunityMembers(communityId: string) {
    return this.memberRepository.find({
      where: { communityId },
      relations: ['user'],
    });
  }

  async getCommunityExchanges(communityId: string) {
    return this.exchangeRepository.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
      relations: ['requester', 'provider'],
    });
  }

  async createImmersiveLearningSession(payload: { title?: string; topic?: string; skill?: string; durationMinutes?: number; steps?: string[] }) {
    return buildImmersiveLearningSession(payload);
  }

  async createExchange(
    data: Partial<SkillExchange>,
    communityId: string,
    requesterId: string,
  ) {
    const membership = await this.memberRepository.findOne({
      where: { communityId, userId: requesterId },
    });
    if (!membership) {
      throw new ForbiddenException('Join the community before creating a skill exchange');
    }

    const exchange = this.exchangeRepository.create({
      ...data,
      communityId,
      requesterId,
    });
    const saved = await this.exchangeRepository.save(exchange);
    await this.communityRepository.increment(
      { id: communityId },
      'exchangeCount',
      1,
    );
    return saved;
  }
}
