import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contribution, ContributionStatus, ContributionType } from './entities/contribution.entity';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OpenSourceService {
  constructor(
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createContribution(userId: string, createDto: CreateContributionDto): Promise<Contribution> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contribution = this.contributionRepository.create({
      ...createDto,
      authorId: userId,
      author: user,
    });

    return this.contributionRepository.save(contribution);
  }

  async findAll(filters?: { status?: ContributionStatus; type?: ContributionType }): Promise<Contribution[]> {
    const query = this.contributionRepository.createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.author', 'author')
      .leftJoinAndSelect('contribution.reviewer', 'reviewer')
      .orderBy('contribution.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('contribution.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      query.andWhere('contribution.type = :type', { type: filters.type });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Contribution> {
    const contribution = await this.contributionRepository.findOne({
      where: { id },
      relations: ['author', 'reviewer'],
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }

    return contribution;
  }

  async findUserContributions(userId: string): Promise<Contribution[]> {
    return this.contributionRepository.find({
      where: { authorId: userId },
      relations: ['author', 'reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateContribution(
    id: string,
    userId: string,
    isAdmin: boolean,
    updateDto: UpdateContributionDto,
  ): Promise<Contribution> {
    const contribution = await this.findOne(id);

    // Only author or admin can update
    if (contribution.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update this contribution');
    }

    // If status is being updated to merged, set mergedAt date
    if (updateDto.status === ContributionStatus.MERGED) {
      updateDto = { ...updateDto, mergedAt: new Date() };
    }

    Object.assign(contribution, updateDto);
    return this.contributionRepository.save(contribution);
  }

  async assignReviewer(id: string, reviewerId: string): Promise<Contribution> {
    const contribution = await this.findOne(id);
    const reviewer = await this.userRepository.findOne({ where: { id: reviewerId } });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    contribution.reviewer = reviewer;
    contribution.reviewerId = reviewerId;
    contribution.status = ContributionStatus.IN_REVIEW;

    return this.contributionRepository.save(contribution);
  }

  async deleteContribution(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const contribution = await this.findOne(id);

    if (contribution.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You are not authorized to delete this contribution');
    }

    await this.contributionRepository.remove(contribution);
  }

  async getContributionStats() {
    const total = await this.contributionRepository.count();
    const pending = await this.contributionRepository.count({ where: { status: ContributionStatus.PENDING } });
    const inReview = await this.contributionRepository.count({ where: { status: ContributionStatus.IN_REVIEW } });
    const merged = await this.contributionRepository.count({ where: { status: ContributionStatus.MERGED } });
    const byType = await this.contributionRepository
      .createQueryBuilder('contribution')
      .select('contribution.type, COUNT(*) as count')
      .groupBy('contribution.type')
      .getRawMany();

    return {
      total,
      pending,
      inReview,
      merged,
      byType,
    };
  }
}