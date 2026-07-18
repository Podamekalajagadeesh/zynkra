import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArchiveMaterialType,
  CulturalArchiveEntry,
  CulturalPreservationCommunity,
  CulturalPreservationCommunityMember,
  PreservationFocus,
} from './entities/cultural-preservation-community.entity';

@Injectable()
export class CulturalPreservationCommunitiesService {
  constructor(
    @InjectRepository(CulturalPreservationCommunity)
    private readonly communityRepository: Repository<CulturalPreservationCommunity>,
    @InjectRepository(CulturalPreservationCommunityMember)
    private readonly memberRepository: Repository<CulturalPreservationCommunityMember>,
    @InjectRepository(CulturalArchiveEntry)
    private readonly archiveRepository: Repository<CulturalArchiveEntry>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Endangered Language Archive Circle',
          focusAreas: [PreservationFocus.LANGUAGE_ARCHIVE, PreservationFocus.ORAL_HISTORY],
          languages: ['Ainu', 'Yuchi', 'Occitan'],
          description: 'A digital archive for endangered languages, pronunciation guides, and community recordings.',
          archiveMethods: ['Audio pronunciation library', 'Living dictionary', 'Speaker mentorship sessions'],
        },
        {
          name: 'Living Traditions Collective',
          focusAreas: [PreservationFocus.TRADITION_ARCHIVE, PreservationFocus.CULTURAL_EDUCATION],
          languages: ['Spanish', 'Quechua', 'English'],
          description: 'A community documenting festivals, recipes, crafts, and rituals so traditions stay accessible.',
          archiveMethods: ['Step-by-step craft tutorials', 'Festival photo essays', 'Recipe and ritual repositories'],
        },
        {
          name: 'Community Memory Vault',
          focusAreas: [PreservationFocus.MEMORY_ARCHIVE, PreservationFocus.ORAL_HISTORY],
          languages: ['English', 'Arabic', 'French'],
          description: 'A shared memory space for family stories, local histories, and intergenerational testimony.',
          archiveMethods: ['Video interviews', 'Photo story capsules', 'Annotated memory timelines'],
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
      relations: ['creator', 'archiveEntries'],
    });
  }

  async getCommunityById(id: string) {
    const comm = await this.communityRepository.findOne({
      where: { id },
      relations: ['creator', 'archiveEntries'],
    });
    if (!comm) throw new NotFoundException('Community not found');
    return comm;
  }

  async createCommunity(data: Partial<CulturalPreservationCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
    data: { role?: string; preferredLanguage?: string },
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

  async getArchiveEntries(communityId: string) {
    return this.archiveRepository.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async createArchiveEntry(data: Partial<CulturalArchiveEntry>, communityId: string, authorId?: string) {
    if (authorId) {
      const membership = await this.memberRepository.findOne({
        where: { communityId, userId: authorId },
      });
      if (!membership) {
        throw new ForbiddenException('Join the community before contributing archive entries');
      }
    }

    const entry = this.archiveRepository.create({ ...data, communityId, authorId });
    return this.archiveRepository.save(entry);
  }
}