import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeciesCommunity, SpeciesCommunityMember, SpeciesMessage, ParticipantType, AnimalSpecies } from './entities/species-community.entity';

@Injectable()
export class SpeciesCommunitiesService {
  constructor(
    @InjectRepository(SpeciesCommunity)
    private readonly communityRepository: Repository<SpeciesCommunity>,
    @InjectRepository(SpeciesCommunityMember)
    private readonly memberRepository: Repository<SpeciesCommunityMember>,
    @InjectRepository(SpeciesMessage)
    private readonly messageRepository: Repository<SpeciesMessage>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Human-Canine Connection',
          includedSpecies: [ParticipantType.HUMAN, ParticipantType.DOMESTIC_ANIMAL],
          animalSpecies: [AnimalSpecies.DOG],
          description: 'A space for humans and their dogs to connect',
          communicationTools: ['Bark Translator', 'Treat Scheduler', 'Playdate Matchmaker'],
        },
        {
          name: 'Feline & Human Bond',
          includedSpecies: [ParticipantType.HUMAN, ParticipantType.DOMESTIC_ANIMAL],
          animalSpecies: [AnimalSpecies.CAT],
          description: 'Strengthen the bond between humans and cats',
          communicationTools: ['Purr Translator', 'Play Session Planner', 'Health Tracker'],
        },
        {
          name: 'AI Companion Collective',
          includedSpecies: [ParticipantType.HUMAN, ParticipantType.AI_ENTITY],
          description: 'Connect with AI entities in friendly spaces',
          communicationTools: ['AI Chat', 'Voice Interaction', 'Collaborative Play'],
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

  async createCommunity(data: Partial<SpeciesCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(
    communityId: string,
    data: {
      participantType: ParticipantType;
      animalSpecies?: AnimalSpecies;
      participantName?: string;
      userId?: string;
    },
  ) {
    const member = this.memberRepository.create({ ...data, communityId });
    const saved = await this.memberRepository.save(member);
    await this.communityRepository.increment({ id: communityId }, 'memberCount', 1);
    return saved;
  }

  async leaveCommunity(communityId: string, memberId: string) {
    const result = await this.memberRepository.delete({ id: memberId });
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

  async getCommunityMessages(communityId: string) {
    return this.messageRepository.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
      relations: ['sender'],
    });
  }

  async sendMessage(data: Partial<SpeciesMessage>, communityId: string) {
    const message = this.messageRepository.create({ ...data, communityId });
    return this.messageRepository.save(message);
  }
}
