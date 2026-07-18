import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdPreference } from './entities/ad-preference.entity';
import { User } from '../../src/users/entities/user.entity';

@Injectable()
export class AdPreferencesService {
  constructor(
    @InjectRepository(AdPreference)
    private adPreferencesRepository: Repository<AdPreference>,
  ) {}

  async findOneByUser(user: User): Promise<AdPreference> {
    return this.adPreferencesRepository.findOne({ where: { userId: user.id } });
  }

  async create(user: User): Promise<AdPreference> {
    const adPreference = this.adPreferencesRepository.create({ userId: user.id });
    return this.adPreferencesRepository.save(adPreference);
  }

  async update(
    adPreference: AdPreference,
    updates: Partial<AdPreference>,
  ): Promise<AdPreference> {
    Object.assign(adPreference, updates);
    return this.adPreferencesRepository.save(adPreference);
  }
}