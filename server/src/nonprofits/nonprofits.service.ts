
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nonprofit } from './entities/nonprofit.entity';
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
}