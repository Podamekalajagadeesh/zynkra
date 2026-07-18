import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NeurodiverseCommunity,
  NeurodiverseCommunityMember,
  NeurodiversityType,
  InterfacePreset,
} from './entities/neurodiverse-community.entity';

@Injectable()
export class NeurodiverseCommunitiesService {
  constructor(
    @InjectRepository(NeurodiverseCommunity)
    private readonly communityRepository: Repository<NeurodiverseCommunity>,
    @InjectRepository(NeurodiverseCommunityMember)
    private readonly memberRepository: Repository<NeurodiverseCommunityMember>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Autistic Spectrum Support',
          primaryNeurodiversities: [NeurodiversityType.AUTISM],
          description: 'A safe space for autistic people to connect and support each other',
          recommendedPreset: InterfacePreset.LOW_STIMULUS,
        },
        {
          name: 'ADHD Creative Minds',
          primaryNeurodiversities: [NeurodiversityType.ADHD],
          description: 'A space for neurodivergent creatives with ADHD',
          recommendedPreset: InterfacePreset.LARGE_TEXT,
        },
        {
          name: 'Dyslexia-Friendly Learning',
          primaryNeurodiversities: [NeurodiversityType.DYSLEXIA],
          description: 'Resources and community for dyslexic learners',
          recommendedPreset: InterfacePreset.HIGH_CONTRAST,
        },
        {
          name: 'All Neurodivergences Welcome',
          primaryNeurodiversities: [
            NeurodiversityType.AUTISM,
            NeurodiversityType.ADHD,
            NeurodiversityType.DYSLEXIA,
            NeurodiversityType.OTHER,
          ],
          description: 'An inclusive space for all neurodivergent people',
          recommendedPreset: InterfacePreset.CUSTOM,
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

  async createCommunity(data: Partial<NeurodiverseCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
    data: {
      userNeurodiversities?: NeurodiversityType[];
      preferredPreset?: InterfacePreset;
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
}
