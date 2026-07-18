import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanetaryCommunity, PlanetaryCommunityMember, GlobalChallenge } from './entities/planetary-community.entity';

@Injectable()
export class PlanetaryCommunitiesService {
  constructor(
    @InjectRepository(PlanetaryCommunity)
    private readonly communityRepository: Repository<PlanetaryCommunity>,
    @InjectRepository(PlanetaryCommunityMember)
    private readonly memberRepository: Repository<PlanetaryCommunityMember>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Global Climate Action Network',
          focusChallenge: GlobalChallenge.CLIMATE_CHANGE,
          description: 'Worldwide coalition working to combat climate change and transition to sustainable energy',
          goals: ['Reduce global carbon emissions', 'Protect biodiversity', 'Promote renewable energy'],
        },
        {
          name: 'Equality For All',
          focusChallenge: GlobalChallenge.INEQUALITY,
          description: 'Fighting for economic, social, and political equality across all nations',
          goals: ['Eradicate extreme poverty', 'Ensure equal opportunity', 'Promote inclusive societies'],
        },
        {
          name: 'Zero Hunger Initiative',
          focusChallenge: GlobalChallenge.WORLD_HUNGER,
          description: 'Global effort to end hunger and achieve food security worldwide',
          goals: ['End global hunger', 'Improve nutrition', 'Sustainable agriculture'],
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

  async createCommunity(data: Partial<PlanetaryCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(communityId: string, userId: string) {
    const existing = await this.memberRepository.findOne({
      where: { communityId, userId },
    });
    if (existing) return existing;

    const member = this.memberRepository.create({ communityId, userId, role: 'member' });
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
}
