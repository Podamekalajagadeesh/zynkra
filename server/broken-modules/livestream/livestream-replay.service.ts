
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveStreamReplay } from './entities/livestream-replay.entity';
import { User } from '../../src/users/entities/user.entity';

@Injectable()
export class LiveStreamReplayService {
  constructor(
    @InjectRepository(LiveStreamReplay)
    private readonly replayRepository: Repository<LiveStreamReplay>,
  ) {}

  async create(
    user: User,
    videoUrl: string,
    title: string,
  ): Promise<LiveStreamReplay> {
    const newReplay = this.replayRepository.create({
      userId: user.id,
      videoUrl,
      title,
    });

    return this.replayRepository.save(newReplay);
  }

  async findByUserId(userId: string): Promise<LiveStreamReplay[]> {
    return this.replayRepository.find({
      where: { userId },
    });
  }

  async publish(replayId: string): Promise<LiveStreamReplay> {
    const replay = await this.replayRepository.findOne({ where: { id: replayId } });
    if (!replay) {
      throw new Error('Replay not found');
    }
    replay.isPublished = true;
    return this.replayRepository.save(replay);
  }
}