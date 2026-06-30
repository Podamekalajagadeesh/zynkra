
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrisisEvent } from './entities/crisis.entity';

@Injectable()
export class CrisisService {
  constructor(
    @InjectRepository(CrisisEvent)
    private readonly crisisEventRepository: Repository<CrisisEvent>,
  ) {}

  async create(eventData: Partial<CrisisEvent>): Promise<CrisisEvent> {
    const newEvent = this.crisisEventRepository.create(eventData);
    return this.crisisEventRepository.save(newEvent);
  }

  async findAll(): Promise<CrisisEvent[]> {
    return this.crisisEventRepository.find();
  }

  async findByRegion(region: string): Promise<CrisisEvent[]> {
    return this.crisisEventRepository.find({ where: { region } });
  }

  async findOne(id: string): Promise<CrisisEvent | null> {
    return this.crisisEventRepository.findOneBy({ id });
  }

  async update(id: string, eventData: Partial<CrisisEvent>): Promise<CrisisEvent | null> {
    await this.crisisEventRepository.update(id, eventData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.crisisEventRepository.delete(id);
  }
}