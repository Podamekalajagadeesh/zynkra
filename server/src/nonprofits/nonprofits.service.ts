
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nonprofit, VerificationStatus } from './entities/nonprofit.entity';
import { CreateNonprofitDto } from './dto/create-nonprofit.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NonprofitsService {
  constructor(
    @InjectRepository(Nonprofit)
    private readonly nonprofitRepository: Repository<Nonprofit>,
  ) {}

  async create(
    createNonprofitDto: CreateNonprofitDto,
    user: User,
  ): Promise<Nonprofit> {
    const nonprofit = this.nonprofitRepository.create({
      ...createNonprofitDto,
      user,
    });

    return this.nonprofitRepository.save(nonprofit);
  }

  async findAll(take = 20, skip = 0): Promise<Nonprofit[]> {
    return this.nonprofitRepository.find({
      where: { verificationStatus: VerificationStatus.APPROVED },
      relations: ['fundraisers'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  async findOne(id: string): Promise<Nonprofit> {
    const nonprofit = await this.nonprofitRepository.findOne({
      where: { id },
      relations: ['fundraisers'],
    });

    if (!nonprofit) {
      throw new NotFoundException(`Nonprofit with ID ${id} not found`);
    }

    return nonprofit;
  }

  async getPending(take = 20, skip = 0): Promise<Nonprofit[]> {
    return this.nonprofitRepository.find({
      where: { verificationStatus: VerificationStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      take,
      skip,
    });
  }

  async approve(id: string): Promise<Nonprofit> {
    const nonprofit = await this.findOne(id);
    nonprofit.verificationStatus = VerificationStatus.APPROVED;
    return this.nonprofitRepository.save(nonprofit);
  }

  async reject(id: string, reason?: string): Promise<Nonprofit> {
    const nonprofit = await this.findOne(id);
    nonprofit.verificationStatus = VerificationStatus.REJECTED;
    if (reason) {
      nonprofit.rejectionReason = reason;
    }
    return this.nonprofitRepository.save(nonprofit);
  }

  async findByUser(user: User): Promise<Nonprofit[]> {
    return this.nonprofitRepository.find({
      where: { user: { id: user.id } },
      relations: ['fundraisers'],
      order: { createdAt: 'DESC' },
    });
  }
}