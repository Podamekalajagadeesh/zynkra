import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AidRequestStatus,
  CrisisAidRequest,
  CrisisResponseCommunity,
  CrisisResponseCommunityMember,
  CrisisResponseFocus,
} from './entities/crisis-response-community.entity';

@Injectable()
export class CrisisResponseCommunitiesService {
  constructor(
    @InjectRepository(CrisisResponseCommunity)
    private readonly communityRepository: Repository<CrisisResponseCommunity>,
    @InjectRepository(CrisisResponseCommunityMember)
    private readonly memberRepository: Repository<CrisisResponseCommunityMember>,
    @InjectRepository(CrisisAidRequest)
    private readonly aidRequestRepository: Repository<CrisisAidRequest>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Global Disaster Relief Network',
          focusAreas: [CrisisResponseFocus.DISASTER_RELIEF, CrisisResponseFocus.EMERGENCY_AID],
          regions: ['Global', 'Coastal regions', 'High-risk weather zones'],
          description: 'Coordinate supplies, volunteers, and verified relief updates during floods, fires, and other disasters.',
          supportChannels: ['Rapid volunteer dispatch', 'Resource tracking', 'Verified relief updates'],
        },
        {
          name: 'Mental Health Rapid Support Collective',
          focusAreas: [CrisisResponseFocus.MENTAL_HEALTH_SUPPORT, CrisisResponseFocus.RECOVERY_PLANNING],
          regions: ['Global', 'Crisis hotlines', 'Community care rooms'],
          description: 'A trusted space for peer support, triage, and emotional first aid during emergencies.',
          supportChannels: ['Peer support matching', 'Crisis counselor routing', 'Wellbeing check-ins'],
        },
        {
          name: 'Emergency Aid Coordination Hub',
          focusAreas: [CrisisResponseFocus.SHELTER_COORDINATION, CrisisResponseFocus.EMERGENCY_AID],
          regions: ['Urban centers', 'Refugee response areas', 'Disaster shelters'],
          description: 'Match needs with shelter, medical, transport, and supply volunteers in real time.',
          supportChannels: ['Shelter listings', 'Donation routing', 'Transport dispatch'],
        },
      ];

      for (const communityData of defaultCommunities) {
        const community = this.communityRepository.create(communityData);
        await this.communityRepository.save(community);
      }
    }
  }

  async getAllCommunities() {
    return this.communityRepository.find({
      order: { memberCount: 'DESC', activeAidRequests: 'DESC', createdAt: 'DESC' },
      relations: ['creator', 'aidRequests'],
    });
  }

  async getCommunityById(id: string) {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['creator', 'aidRequests'],
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async createCommunity(data: Partial<CrisisResponseCommunity>, creatorId: string) {
    const community = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(community);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
    data: {
      role?: string;
      skillsToOffer?: string[];
      supportPreference?: string[];
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

  async getAidRequests(communityId: string) {
    return this.aidRequestRepository.find({
      where: { communityId },
      order: { isUrgent: 'DESC', createdAt: 'DESC' },
      relations: ['requester'],
    });
  }

  async createAidRequest(data: Partial<CrisisAidRequest>, communityId: string, requesterId?: string) {
    if (requesterId) {
      const membership = await this.memberRepository.findOne({
        where: { communityId, userId: requesterId },
      });
      if (!membership) {
        throw new ForbiddenException('Join the community before creating an aid request');
      }
    }

    const request = this.aidRequestRepository.create({
      ...data,
      communityId,
      requesterId,
      status: data.status ?? AidRequestStatus.OPEN,
    });
    const saved = await this.aidRequestRepository.save(request);
    await this.communityRepository.increment({ id: communityId }, 'activeAidRequests', 1);
    return saved;
  }

  async updateAidRequest(
    communityId: string,
    requestId: string,
    data: Partial<CrisisAidRequest>,
    userId?: string,
  ) {
    const request = await this.aidRequestRepository.findOne({
      where: { id: requestId, communityId },
    });
    if (!request) throw new NotFoundException('Aid request not found');

    if (userId && request.requesterId !== userId) {
      const membership = await this.memberRepository.findOne({
        where: { communityId, userId },
      });
      if (!membership) {
        throw new ForbiddenException('Only members can update aid requests');
      }
    }

    Object.assign(request, data);
    return this.aidRequestRepository.save(request);
  }
}