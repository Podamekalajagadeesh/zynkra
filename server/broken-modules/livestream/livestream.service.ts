import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stream } from './entities/stream.entity';
import { UsersService } from '../../src/users/users.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LivestreamService {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    private readonly usersService: UsersService,
  ) {}

  async createStream(
    userId: string,
    title: string,
    description: string,
  ): Promise<Stream> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const streamKey = uuidv4();

    const stream = this.streamRepository.create({
      title,
      description,
      streamKey,
      userId,
    });

    return this.streamRepository.save(stream);
  }

  async getStreamByKey(streamKey: string): Promise<Stream | undefined> {
    return this.streamRepository.findOne({ where: { streamKey } });
  }

  async getStreamByUser(userId: string): Promise<Stream | undefined> {
    return this.streamRepository.findOne({ where: { userId } });
  }
}