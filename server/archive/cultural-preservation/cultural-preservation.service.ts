import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CulturalCommunity, CulturalCommunityMember, CulturalArchive, CulturalFocus } from './entities/cultural-community.entity';
import { buildArchiveLibrarySummary } from './archive-library';

@Injectable()
export class CulturalPreservationService {
  constructor(
    @InjectRepository(CulturalCommunity)
    private readonly communityRepository: Repository<CulturalCommunity>,
    @InjectRepository(CulturalCommunityMember)
    private readonly memberRepository: Repository<CulturalCommunityMember>,
    @InjectRepository(CulturalArchive)
    private readonly archiveRepository: Repository<CulturalArchive>,
  ) {
    this.initializeDefaultCommunities();
  }

  private async initializeDefaultCommunities() {
    const count = await this.communityRepository.count();
    if (count === 0) {
      const defaultCommunities = [
        {
          name: 'Endangered Languages Archive',
          focus: [CulturalFocus.LANGUAGES, CulturalFocus.TRADITIONS],
          description: 'Preserve endangered languages from around the world',
          languages: ['Quechua', 'Hawaiian', 'Ainu'],
        },
        {
          name: 'Traditional Crafts & Artisans',
          focus: [CulturalFocus.CRAFTS, CulturalFocus.TRADITIONS],
          description: 'Share traditional crafts and techniques',
          traditions: ['Pottery', 'Weaving', 'Blacksmithing'],
        },
        {
          name: 'Oral Histories & Memories',
          focus: [CulturalFocus.MEMORIES, CulturalFocus.HISTORY],
          description: 'Record and preserve oral histories and personal memories',
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

  async createCommunity(data: Partial<CulturalCommunity>, creatorId: string) {
    const comm = this.communityRepository.create({ ...data, creatorId });
    return this.communityRepository.save(comm);
  }

  async joinCommunity(communityId: string, userId: string, data: { role?: string }) {
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

  async createArchive(
    data: Partial<CulturalArchive>,
    communityId: string,
    uploaderId: string,
  ) {
    const archive = this.archiveRepository.create({ ...data, communityId, uploaderId });
    const saved = await this.archiveRepository.save(archive);
    await this.communityRepository.increment({ id: communityId }, 'archivedCount', 1);
    const summary = buildArchiveLibrarySummary({
      title: saved.title,
      description: saved.description,
      materialType: saved.type,
      language: saved.language,
    });
    return { ...saved, librarySummary: summary };
  }

  async getCommunityArchives(communityId: string) {
    const archives = await this.archiveRepository.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
      relations: ['uploader'],
    });

    return archives.map((archive) => ({
      ...archive,
      librarySummary: buildArchiveLibrarySummary({
        title: archive.title,
        description: archive.description,
        materialType: archive.type,
        language: archive.language,
      }),
    }));
  }
}
