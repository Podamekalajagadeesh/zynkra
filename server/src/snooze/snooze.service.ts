import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snooze } from './entities/snooze.entity';
import { CreateSnoozeDto } from './dto/create-snooze.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SnoozeService {
  constructor(
    @InjectRepository(Snooze)
    private snoozeRepository: Repository<Snooze>,
  ) {}

  async snooze(
    user: User,
    createSnoozeDto: CreateSnoozeDto,
  ): Promise<Snooze> {
    const snooze = this.snoozeRepository.create({
      ...createSnoozeDto,
      user,
      snoozeEndDate: new Date(createSnoozeDto.snoozeEndDate),
    });
    return this.snoozeRepository.save(snooze);
  }

  async unsnooze(user: User, snoozedId: string): Promise<void> {
    const result = await this.snoozeRepository.delete({ user, snoozedId });
    if (result.affected === 0) {
      throw new NotFoundException('Snooze record not found');
    }
  }

  async getSnoozed(user: User): Promise<Snooze[]> {
    return this.snoozeRepository.find({ where: { user } });
  }

  async isSnoozed(
    userId: string,
    snoozedId: string,
  ): Promise<boolean> {
    const snooze = await this.snoozeRepository.findOne({
      where: { user: { id: userId }, snoozedId },
    });
    return snooze ? new Date() < new Date(snooze.snoozeEndDate) : false;
  }
}