import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from './entities/thread.entity';
import { ThreadMessage } from './entities/thread-message.entity';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendThreadMessageDto } from './dto/send-thread-message.dto';

interface ThreadListStats {
  threadId: string;
  messageCount: number;
  lastMessageAt: Date;
}

@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(Thread)
    private readonly threadsRepository: Repository<Thread>,
    @InjectRepository(ThreadMessage)
    private readonly messagesRepository: Repository<ThreadMessage>,
  ) {}

  async createThread(dto: CreateThreadDto, userId: string): Promise<Thread> {
    const thread = this.threadsRepository.create({
      title: dto.title ?? null,
      userId,
    });
    await this.threadsRepository.save(thread);

    if (dto.content) {
      await this.sendMessage(thread.id, { content: dto.content }, userId);
    }

    return this.findOne(thread.id);
  }

  async findAll(): Promise<Thread[]> {
    const threads = await this.threadsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const stats = await this.messagesRepository
      .createQueryBuilder('message')
      .select('message.threadId', 'threadId')
      .addSelect('COUNT(*)::int', 'messageCount')
      .addSelect('MAX(message.createdAt)', 'lastMessageAt')
      .groupBy('message.threadId')
      .getRawMany<ThreadListStats>();

    const statsByThread = new Map(stats.map((s) => [s.threadId, s]));
    for (const thread of threads) {
      thread.messageCount = statsByThread.get(thread.id)?.messageCount ?? 0;
      thread.lastMessageAt = statsByThread.get(thread.id)?.lastMessageAt ?? thread.createdAt;
    }

    return threads;
  }

  async findOne(id: string): Promise<Thread> {
    const thread = await this.threadsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!thread) {
      throw new NotFoundException(`Thread with ID "${id}" not found`);
    }

    const messages = await this.messagesRepository.find({
      where: { threadId: id },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return { ...thread, messages };
  }

  async sendMessage(threadId: string, dto: SendThreadMessageDto, userId: string): Promise<ThreadMessage> {
    const thread = await this.threadsRepository.findOne({ where: { id: threadId } });
    if (!thread) {
      throw new NotFoundException(`Thread with ID "${threadId}" not found`);
    }

    if (dto.parentMessageId) {
      const parent = await this.messagesRepository.findOne({
        where: { id: dto.parentMessageId },
      });
      if (!parent || parent.threadId !== threadId) {
        throw new BadRequestException('Parent message is not part of this thread');
      }
    }

    const message = this.messagesRepository.create({
      thread,
      threadId,
      userId,
      content: dto.content,
      parentMessageId: dto.parentMessageId ?? null,
    });
    await this.messagesRepository.save(message);
    return this.messagesRepository.findOne({ where: { id: message.id }, relations: ['user'] });
  }

  async deleteThread(id: string, userId: string): Promise<void> {
    const thread = await this.threadsRepository.findOne({ where: { id } });
    if (!thread) {
      throw new NotFoundException(`Thread with ID "${id}" not found`);
    }
    if (thread.userId !== userId) {
      throw new ForbiddenException('Only the thread creator can delete it');
    }
    await this.threadsRepository.remove(thread);
  }

  async deleteMessage(threadId: string, messageId: string, userId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({ where: { id: messageId } });
    if (!message || message.threadId !== threadId) {
      throw new NotFoundException('Message not found in this thread');
    }
    if (message.userId !== userId) {
      throw new ForbiddenException('Only the message author can delete it');
    }
    await this.messagesRepository.remove(message);
  }
}
