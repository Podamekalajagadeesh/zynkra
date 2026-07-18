import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccessibilityAccommodationRequest,
  AccessibilityCommunityMember,
  AccessibilityFirstCommunity,
  AccessibilityNeedType,
  AccommodationRequestStatus,
  InterfacePreset,
} from './entities/accessibility-first-community.entity';

@Injectable()
export class AccessibilityFirstCommunitiesService {
  constructor(
    @InjectRepository(AccessibilityFirstCommunity)
    private readonly communityRepository: Repository<AccessibilityFirstCommunity>,
    @InjectRepository(AccessibilityCommunityMember)
    private readonly memberRepository: Repository<AccessibilityCommunityMember>,
    @InjectRepository(AccessibilityAccommodationRequest)
    private readonly requestRepository: Repository<AccessibilityAccommodationRequest>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Low-Stimulus Social Circle',
          supportedNeeds: [AccessibilityNeedType.SENSORY, AccessibilityNeedType.COGNITIVE],
          description: 'A fully adaptable social space with reduced visual noise, predictable interactions, and calm pacing.',
          interfaceProfiles: [InterfacePreset.LOW_STIMULUS, InterfacePreset.SLOW_ANIMATIONS, InterfacePreset.CUSTOM],
          accessibilityFeatures: ['Motion reduction', 'Predictable navigation', 'Distraction-free rooms'],
          customInterfaceTemplates: ['Calm mode', 'Focus mode', 'Quiet mode'],
        },
        {
          name: 'Screen Reader First Network',
          supportedNeeds: [AccessibilityNeedType.VISUAL, AccessibilityNeedType.PHYSICAL],
          description: 'Built for screen readers, keyboard navigation, and voice-first participation.',
          interfaceProfiles: [InterfacePreset.SCREEN_READER_FIRST, InterfacePreset.KEYBOARD_NAV_ONLY, InterfacePreset.CUSTOM],
          accessibilityFeatures: ['ARIA-first layouts', 'Voice commands', 'Keyboard shortcut maps'],
          customInterfaceTemplates: ['Voice-first mode', 'Keyboard-only mode', 'Braille-friendly mode'],
        },
        {
          name: 'Universal Access Commons',
          supportedNeeds: [
            AccessibilityNeedType.PHYSICAL,
            AccessibilityNeedType.COGNITIVE,
            AccessibilityNeedType.VISUAL,
            AccessibilityNeedType.HEARING,
          ],
          description: 'An inclusive community for multiple access needs with flexible sensory and interface settings.',
          interfaceProfiles: [InterfacePreset.HIGH_CONTRAST, InterfacePreset.LARGE_TEXT, InterfacePreset.CUSTOM],
          accessibilityFeatures: ['Captioning on by default', 'Contrast boosts', 'Simplified layouts'],
          customInterfaceTemplates: ['High contrast mode', 'Large print mode', 'Sensory-friendly mode'],
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
      order: { memberCount: 'DESC', activeRequests: 'DESC', createdAt: 'DESC' },
      relations: ['creator', 'accommodationRequests'],
    });
  }

  async getCommunityById(id: string) {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['creator', 'accommodationRequests'],
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async createCommunity(data: Partial<AccessibilityFirstCommunity>, creatorId: string) {
    const community = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(community);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
    data: {
      role?: string;
      accessibilityNeeds?: AccessibilityNeedType[];
      preferredPreset?: InterfacePreset;
      customSettings?: Record<string, any>;
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

  async getAccommodationRequests(communityId: string) {
    return this.requestRepository.find({
      where: { communityId },
      order: { isUrgent: 'DESC', createdAt: 'DESC' },
      relations: ['requester'],
    });
  }

  async createAccommodationRequest(
    data: Partial<AccessibilityAccommodationRequest>,
    communityId: string,
    requesterId?: string,
  ) {
    if (requesterId) {
      const membership = await this.memberRepository.findOne({
        where: { communityId, userId: requesterId },
      });
      if (!membership) {
        throw new ForbiddenException('Join the community before creating an accommodation request');
      }
    }

    const request = this.requestRepository.create({
      ...data,
      communityId,
      requesterId,
      status: data.status ?? AccommodationRequestStatus.OPEN,
    });
    const saved = await this.requestRepository.save(request);
    await this.communityRepository.increment({ id: communityId }, 'activeRequests', 1);
    return saved;
  }

  async updateAccommodationRequest(
    communityId: string,
    requestId: string,
    data: Partial<AccessibilityAccommodationRequest>,
    userId?: string,
  ) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, communityId },
    });
    if (!request) throw new NotFoundException('Accommodation request not found');

    if (userId && request.requesterId !== userId) {
      const membership = await this.memberRepository.findOne({
        where: { communityId, userId },
      });
      if (!membership) {
        throw new ForbiddenException('Only members can update accommodation requests');
      }
    }

    Object.assign(request, data);
    return this.requestRepository.save(request);
  }
}