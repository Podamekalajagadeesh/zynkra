import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IntergenerationalSpace,
  IntergenerationalSpaceMember,
  AgeGroup,
  KnowledgeFocus,
} from './entities/intergenerational-space.entity';

@Injectable()
export class IntergenerationalSpacesService {
  constructor(
    @InjectRepository(IntergenerationalSpace)
    private readonly spaceRepository: Repository<IntergenerationalSpace>,
    @InjectRepository(IntergenerationalSpaceMember)
    private readonly memberRepository: Repository<IntergenerationalSpaceMember>,
  ) {
    this.initializeDefaultSpaces();
  }

  private async initializeDefaultSpaces() {
    const count = await this.spaceRepository.count();
    if (count === 0) {
      const defaultSpaces = [
        {
          name: 'Grandparents & Grandkids Story Circle',
          focus: KnowledgeFocus.TRADITIONS,
          description: 'Preserve family traditions and stories across generations',
          goals: ['Share oral histories', 'Pass down family recipes', 'Build intergenerational bonds'],
          includedAgeGroups: [AgeGroup.YOUTH, AgeGroup.SENIOR],
        },
        {
          name: 'Tech Buddies',
          focus: KnowledgeFocus.TECHNOLOGY,
          description: 'Youth teach seniors about technology, seniors share life wisdom',
          goals: ['Digital literacy for seniors', 'Intergenerational mentorship'],
          includedAgeGroups: [AgeGroup.YOUTH, AgeGroup.SENIOR],
        },
        {
          name: 'Cultural Heritage Exchange',
          focus: KnowledgeFocus.CULTURE,
          description: 'Share and preserve cultural practices across all age groups',
          goals: ['Preserve cultural traditions', 'Teach traditional crafts', 'Share cultural history'],
          includedAgeGroups: [AgeGroup.YOUTH, AgeGroup.ADULT, AgeGroup.SENIOR],
        },
      ];

      for (const spaceData of defaultSpaces) {
        const space = this.spaceRepository.create(spaceData);
        await this.spaceRepository.save(space);
      }
    }
  }

  async getAllSpaces() {
    return this.spaceRepository.find({
      order: { memberCount: 'DESC', createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getSpaceById(id: string) {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!space) throw new NotFoundException('Space not found');
    return space;
  }

  async createSpace(data: Partial<IntergenerationalSpace>, creatorId: string) {
    const space = this.spaceRepository.create({ ...data, creatorId });
    return this.spaceRepository.save(space);
  }

  async joinSpace(
    spaceId: string,
    userId: string,
    data: { ageGroup: AgeGroup; expertise?: string; learningGoals?: string },
  ) {
    const existing = await this.memberRepository.findOne({
      where: { spaceId, userId },
    });
    if (existing) return existing;

    const member = this.memberRepository.create({ ...data, spaceId, userId });
    const saved = await this.memberRepository.save(member);
    await this.spaceRepository.increment({ id: spaceId }, 'memberCount', 1);
    return saved;
  }

  async leaveSpace(spaceId: string, userId: string) {
    const result = await this.memberRepository.delete({ spaceId, userId });
    if (result.affected) {
      await this.spaceRepository.decrement({ id: spaceId }, 'memberCount', 1);
    }
    return result;
  }

  async getUserMemberships(userId: string) {
    return this.memberRepository.find({
      where: { userId },
      relations: ['space'],
    });
  }

  async getSpaceMembers(spaceId: string) {
    return this.memberRepository.find({
      where: { spaceId },
      relations: ['user'],
    });
  }
}
