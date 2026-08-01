import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomAudience } from './entities/custom-audience.entity';

@Injectable()
export class CustomAudiencesService {
  constructor(
    @InjectRepository(CustomAudience)
    private readonly repository: Repository<CustomAudience>,
  ) {}

  async listForUser(userId: string): Promise<CustomAudience[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, name: string): Promise<CustomAudience> {
    const audience = this.repository.create({
      userId,
      name,
      userIds: [],
    });
    return this.repository.save(audience);
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; userIds?: string[] },
  ): Promise<CustomAudience> {
    const audience = await this.repository.findOne({ where: { id, userId } });
    if (!audience) {
      throw new NotFoundException('Custom audience not found');
    }
    if (typeof data?.name === 'string' && data.name.trim()) {
      audience.name = data.name.trim();
    }
    if (Array.isArray(data?.userIds)) {
      audience.userIds = data.userIds;
    }
    return this.repository.save(audience);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException('Custom audience not found');
    }
  }
}
