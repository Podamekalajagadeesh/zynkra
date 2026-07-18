import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataCollectionLog, DataPurpose } from './entities/data-collection-log.entity';
import { DataMinimizationPolicy } from './entities/data-minimization-policy.entity';

@Injectable()
export class DataMinimizationService {
  constructor(
    @InjectRepository(DataCollectionLog)
    private readonly logRepository: Repository<DataCollectionLog>,
    @InjectRepository(DataMinimizationPolicy)
    private readonly policyRepository: Repository<DataMinimizationPolicy>,
  ) {
    this.initializeDefaultPolicy();
  }

  private async initializeDefaultPolicy() {
    const count = await this.policyRepository.count();
    if (count === 0) {
      const defaultPolicy = this.policyRepository.create({
        policyName: 'Default Data Minimization',
        description: 'Default policy to collect only necessary data',
        allowedDataTypes: ['username', 'email', 'content'],
        requiredDataTypes: ['username', 'email'],
        enabled: true,
        retentionDays: 90,
      });
      await this.policyRepository.save(defaultPolicy);
    }
  }

  async getPolicy() {
    return this.policyRepository.findOne({ order: { createdAt: 'DESC' } });
  }

  async updatePolicy(data: Partial<DataMinimizationPolicy>) {
    const policy = await this.getPolicy();
    if (policy) {
      Object.assign(policy, data);
      return this.policyRepository.save(policy);
    }
    return this.policyRepository.save(this.policyRepository.create(data));
  }

  async logDataCollection(
    userId: string | undefined,
    dataTypes: string[],
    purpose: DataPurpose,
    necessary: boolean,
    minimal: boolean,
    collectionDetails?: any,
  ) {
    const log = this.logRepository.create({
      userId,
      dataTypes,
      purpose,
      necessary,
      minimal,
      collectionDetails,
    });
    return this.logRepository.save(log);
  }

  async getUserLogs(userId: string, limit: number = 100) {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllLogs(limit: number = 100) {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getStats() {
    const [total, necessary, minimal] = await Promise.all([
      this.logRepository.count(),
      this.logRepository.count({ where: { necessary: true } }),
      this.logRepository.count({ where: { minimal: true } }),
    ]);
    return { total, necessary, minimal };
  }
}
