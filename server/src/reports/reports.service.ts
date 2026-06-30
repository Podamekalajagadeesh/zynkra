import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  async create(
    reason: string,
    reporter: User,
    post: Post,
  ): Promise<Report> {
    const report = this.reportsRepository.create({
      reason,
      reporter,
      post,
    });
    return this.reportsRepository.save(report);
  }

  async findAll(take = 10, skip = 0): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['reporter', 'post', 'post.user'],
      take,
      skip,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['reporter', 'post', 'post.user'],
    });
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.reportsRepository.remove(report);
  }
}