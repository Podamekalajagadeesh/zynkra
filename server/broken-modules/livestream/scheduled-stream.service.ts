import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledStream } from './entities/scheduled-stream.entity';
import { CreateScheduledStreamDto } from './dto/create-scheduled-stream.dto';
import { User } from '../../src/users/entities/user.entity';

@Injectable()
export class ScheduledStreamService {
  constructor(
    @InjectRepository(ScheduledStream)
    private scheduledStreamRepository: Repository<ScheduledStream>,
  ) {}

  async create(createScheduledStreamDto: CreateScheduledStreamDto, user: User): Promise<ScheduledStream> {
    const newScheduledStream = this.scheduledStreamRepository.create({
      ...createScheduledStreamDto,
      userId: user.id,
    });
    return this.scheduledStreamRepository.save(newScheduledStream);
  }

  async findAll(): Promise<ScheduledStream[]> {
    return this.scheduledStreamRepository.find();
  }

  async findOne(id: string): Promise<ScheduledStream> {
    return this.scheduledStreamRepository.findOne({ where: { id } });
  }

  async findByUser(userId: string): Promise<ScheduledStream[]> {
    return this.scheduledStreamRepository.find({ where: { userId } });
  }

  async update(id: string, updates: Partial<ScheduledStream>): Promise<ScheduledStream> {
    await this.scheduledStreamRepository.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.scheduledStreamRepository.delete(id);
  }
}