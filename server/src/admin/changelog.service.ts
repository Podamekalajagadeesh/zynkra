import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangelogEntryEntity } from './entities/changelog-entry.entity';
import { CreateChangelogEntryDto } from './dto/create-changelog-entry.dto';

@Injectable()
export class ChangelogService {
  constructor(
    @InjectRepository(ChangelogEntryEntity)
    private readonly repository: Repository<ChangelogEntryEntity>,
  ) {}

  async list(limit = 50): Promise<ChangelogEntryEntity[]> {
    return this.repository.find({
      order: { publishedAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async findByVersion(version: string): Promise<ChangelogEntryEntity | null> {
    return this.repository.findOne({ where: { version } });
  }

  async publish(input: CreateChangelogEntryDto): Promise<ChangelogEntryEntity> {
    const existing = await this.findByVersion(input.version);
    if (existing) {
      throw new ConflictException(`Changelog version ${input.version} already exists`);
    }

    return this.repository.save(this.repository.create({
      version: input.version,
      title: input.title,
      body: input.body,
      changes: input.changes,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
    }));
  }
}
