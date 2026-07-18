import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalInheritance, InheritanceStatus } from './entities/digital-inheritance.entity';

@Injectable()
export class DigitalInheritanceService {
  constructor(
    @InjectRepository(DigitalInheritance)
    private readonly inheritanceRepository: Repository<DigitalInheritance>,
  ) {}

  async createInheritance(ownerId: string, data: Partial<DigitalInheritance>) {
    const inheritance = this.inheritanceRepository.create({
      ...data,
      ownerId,
    });
    return this.inheritanceRepository.save(inheritance);
  }

  async getInheritancesForOwner(ownerId: string) {
    return this.inheritanceRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getInheritanceById(id: string, userId: string) {
    const inheritance = await this.inheritanceRepository.findOneBy({ id });
    if (!inheritance) {
      throw new NotFoundException('Inheritance not found');
    }
    if (inheritance.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return inheritance;
  }

  async updateInheritance(id: string, userId: string, data: Partial<DigitalInheritance>) {
    const inheritance = await this.getInheritanceById(id, userId);
    Object.assign(inheritance, data);
    return this.inheritanceRepository.save(inheritance);
  }

  async activateInheritance(id: string, userId: string) {
    const inheritance = await this.getInheritanceById(id, userId);
    inheritance.status = InheritanceStatus.ACTIVE;
    return this.inheritanceRepository.save(inheritance);
  }

  async cancelInheritance(id: string, userId: string) {
    const inheritance = await this.getInheritanceById(id, userId);
    inheritance.status = InheritanceStatus.CANCELLED;
    return this.inheritanceRepository.save(inheritance);
  }

  async executeInheritance(id: string) {
    const inheritance = await this.inheritanceRepository.findOneBy({ id });
    if (!inheritance) {
      throw new NotFoundException('Inheritance not found');
    }
    inheritance.status = InheritanceStatus.EXECUTED;
    inheritance.executedAt = new Date();
    return this.inheritanceRepository.save(inheritance);
  }

  async getInheritancesForBeneficiary(beneficiaryId: string) {
    return this.inheritanceRepository.find({
      where: { beneficiaryId, status: InheritanceStatus.ACTIVE },
    });
  }
}
