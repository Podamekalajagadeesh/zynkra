import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalizedCommunity, LocalizedCommunityMember, LocalMeetup, CommunityType } from './entities/localized-community.entity';

@Injectable()
export class LocalizedCommunitiesService {
  constructor(
    @InjectRepository(LocalizedCommunity)
    private readonly communityRepository: Repository<LocalizedCommunity>,
    @InjectRepository(LocalizedCommunityMember)
    private readonly memberRepository: Repository<LocalizedCommunityMember>,
    @InjectRepository(LocalMeetup)
    private readonly meetupRepository: Repository<LocalMeetup>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Downtown Neighborhood Hub',
          type: CommunityType.NEIGHBORHOOD,
          description: 'Connect with your downtown neighbors for activities',
          locationName: 'Downtown',
          latitude: 40.7128,
          longitude: -74.006,
          radiusKm: 2,
          digitalFeatures: ['Local Events Calendar', 'Lost & Found', 'Community Bulletin'],
        },
        {
          name: 'Citywide Garden Club',
          type: CommunityType.CITY,
          description: 'Share gardening tips and organize community garden events',
          locationName: 'Citywide',
          radiusKm: 50,
          digitalFeatures: ['Seed Exchange', 'Plant Swap Calendar', 'Garden Tips Forum'],
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

  async createCommunity(data: Partial<LocalizedCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(communityId: string, userId: string, data: { localRole?: string }) {
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

  async getCommunityMeetups(communityId: string) {
    return this.meetupRepository.find({
      where: { communityId },
      order: { startTime: 'ASC' },
    });
  }

  async createMeetup(data: Partial<LocalMeetup>, communityId: string) {
    const meetup = this.meetupRepository.create({ ...data, communityId });
    return this.meetupRepository.save(meetup);
  }

  async rsvpToMeetup(meetupId: string, userId: string) {
    await this.meetupRepository.increment({ id: meetupId }, 'attendeeCount', 1);
  }
}
