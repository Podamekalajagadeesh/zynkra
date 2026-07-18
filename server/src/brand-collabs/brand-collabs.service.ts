import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, In } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CollabOpportunity } from './entities/collab-opportunity.entity';
import { CollabApplication } from './entities/collab-application.entity';
import { User } from '../users/entities/user.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCollabOpportunityDto } from './dto/create-collab-opportunity.dto';
import { SubmitCollabApplicationDto } from './dto/submit-collab-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class BrandCollabsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(CollabOpportunity)
    private readonly opportunityRepository: Repository<CollabOpportunity>,
    @InjectRepository(CollabApplication)
    private readonly applicationRepository: Repository<CollabApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Brand management
  async createBrand(user: User, dto: CreateBrandDto): Promise<Brand> {
    const brand = this.brandRepository.create({
      ...dto,
      userId: user.id,
    });
    return this.brandRepository.save(brand);
  }

  async getUserBrands(userId: string): Promise<Brand[]> {
    return this.brandRepository.find({
      where: { userId },
      relations: ['opportunities'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBrandById(brandId: string, userId: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
      relations: ['opportunities'],
    });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand.userId !== userId) throw new ForbiddenException('Access denied');
    return brand;
  }

  // Collab Opportunities management
  async createCollabOpportunity(user: User, brandId: string, dto: CreateCollabOpportunityDto): Promise<CollabOpportunity> {
    const brand = await this.brandRepository.findOne({ where: { id: brandId, userId: user.id } });
    if (!brand) throw new NotFoundException('Brand not found or access denied');

    const opportunity = this.opportunityRepository.create({
      ...dto,
      brandId,
    });
    return this.opportunityRepository.save(opportunity);
  }

  async getOpportunities(filters?: {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    minFollowers?: number;
    search?: string;
  }): Promise<CollabOpportunity[]> {
    const queryBuilder = this.opportunityRepository
      .createQueryBuilder('opportunity')
      .leftJoinAndSelect('opportunity.brand', 'brand')
      .where('opportunity.status = :status', { status: 'open' });

    if (filters?.category) {
      queryBuilder.andWhere('opportunity.category = :category', { category: filters.category });
    }
    if (filters?.minBudget) {
      queryBuilder.andWhere('opportunity.budget >= :minBudget', { minBudget: filters.minBudget });
    }
    if (filters?.maxBudget) {
      queryBuilder.andWhere('opportunity.budget <= :maxBudget', { maxBudget: filters.maxBudget });
    }
    if (filters?.minFollowers) {
      queryBuilder.andWhere('opportunity.minFollowers <= :minFollowers', { minFollowers: filters.minFollowers });
    }
    if (filters?.search) {
      queryBuilder.andWhere(
        '(opportunity.title ILIKE :search OR opportunity.description ILIKE :search OR brand.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.orderBy('opportunity.createdAt', 'DESC').getMany();
  }

  async getOpportunityById(opportunityId: string): Promise<CollabOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: ['brand', 'applications'],
    });
    if (!opportunity) throw new NotFoundException('Collab opportunity not found');
    return opportunity;
  }

  async getUserOpportunities(userId: string): Promise<CollabOpportunity[]> {
    const brands = await this.brandRepository.find({ where: { userId } });
    const brandIds = brands.map(b => b.id);
    return this.opportunityRepository.find({
      where: { brandId: In(brandIds) },
      relations: ['brand', 'applications'],
      order: { createdAt: 'DESC' },
    });
  }

  // Collab Applications management
  async submitApplication(user: User, opportunityId: string, dto: SubmitCollabApplicationDto): Promise<CollabApplication> {
    const opportunity = await this.getOpportunityById(opportunityId);
    
    // Check if user already applied
    const existingApplication = await this.applicationRepository.findOne({
      where: { opportunityId, creatorId: user.id },
    });
    if (existingApplication) throw new Error('You have already applied to this opportunity');

    const application = this.applicationRepository.create({
      ...dto,
      opportunityId,
      creatorId: user.id,
    });
    return this.applicationRepository.save(application);
  }

  async getUserApplications(userId: string): Promise<CollabApplication[]> {
    return this.applicationRepository.find({
      where: { creatorId: userId },
      relations: ['opportunity', 'opportunity.brand'],
      order: { appliedAt: 'DESC' },
    });
  }

  async getOpportunityApplications(opportunityId: string, userId: string): Promise<CollabApplication[]> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: ['brand'],
    });
    if (!opportunity || opportunity.brand.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.applicationRepository.find({
      where: { opportunityId },
      relations: ['creator'],
      order: { appliedAt: 'DESC' },
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    dto: UpdateApplicationStatusDto
  ): Promise<CollabApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['opportunity', 'opportunity.brand'],
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.opportunity.brand.userId !== userId) throw new ForbiddenException('Access denied');

    application.status = dto.status;
    if (dto.rejectionReason) application.rejectionReason = dto.rejectionReason;
    return this.applicationRepository.save(application);
  }

  // Stats for dashboard
  async getDashboardStats(userId: string) {
    const brands = await this.brandRepository.find({ where: { userId } });
    const brandIds = brands.map(b => b.id);
    
    const totalOpportunities = await this.opportunityRepository.count({ where: { brandId: In(brandIds) } });
    const totalApplications = await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.opportunity', 'opportunity')
      .where('opportunity.brandId IN (:...brandIds)', { brandIds })
      .getCount();
    
    const acceptedApplications = await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.opportunity', 'opportunity')
      .where('opportunity.brandId IN (:...brandIds)', { brandIds })
      .andWhere('application.status = :status', { status: 'accepted' })
      .getCount();

    const creatorApplications = await this.applicationRepository.count({ where: { creatorId: userId } });
    const creatorAccepted = await this.applicationRepository.count({ 
      where: { creatorId: userId, status: 'accepted' } 
    });

    return {
      // Brand stats
      totalBrands: brands.length,
      totalOpportunities,
      totalApplications,
      acceptedApplications,
      // Creator stats
      creatorApplications,
      creatorAccepted,
    };
  }
}