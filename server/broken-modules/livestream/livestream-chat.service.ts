import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveStreamComment } from './entities/livestream-comment.entity';
import { User } from '../../src/users/entities/user.entity';

@Injectable()
export class LivestreamChatService {
  constructor(
    @InjectRepository(LiveStreamComment)
    private readonly commentRepository: Repository<LiveStreamComment>,
  ) {}

  async createComment(content: string, user: User, streamId: string): Promise<LiveStreamComment> {
    const comment = this.commentRepository.create({ content, userId: user.id, streamId });
    return this.commentRepository.save(comment);
  }

  async getComments(streamId: string): Promise<LiveStreamComment[]> {
    return this.commentRepository.find({ where: { streamId } });
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (comment && comment.userId === userId) {
      await this.commentRepository.delete(commentId);
    }
  }
}