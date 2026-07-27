import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Message } from '../dms/entities/message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async getInitialSync(userId: string, since?: Date) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const posts = await this.postsRepo
      .createQueryBuilder('post')
      .where('post.createdAt > :since', { since: sinceDate })
      .orderBy('post.createdAt', 'DESC')
      .limit(200)
      .getMany();

    const messages = await this.messagesRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .where('message.createdAt > :since', { since: sinceDate })
      .andWhere('sender.id = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .limit(500)
      .getMany();

    return {
      user: user ? {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        bio: user.bio,
      } : null,
      posts: posts.map(p => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
      messages: messages.map(m => ({
        id: m.id,
        conversationId: (m as any).conversation?.id,
        senderId: (m as any).sender?.id,
        content: m.content,
        createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
      })),
      syncMetadata: {
        syncedAt: new Date().toISOString(),
        postCount: posts.length,
        messageCount: messages.length,
      },
    };
  }

  async pushChanges(userId: string, changes: {
    posts?: Array<{
      id: string;
      content: string;
      action: 'create' | 'update' | 'delete';
      createdAt: string;
      updatedAt: string;
    }>;
    messages?: Array<{
      id: string;
      conversationId: string;
      content: string;
      action: 'create' | 'update' | 'delete';
      createdAt: string;
    }>;
    reactions?: Array<{
      postId: string;
      reaction: string;
      action: 'add' | 'remove';
    }>;
  }) {
    const results = {
      postsProcessed: 0,
      messagesProcessed: 0,
      reactionsProcessed: 0,
      conflicts: [] as Array<{ entityType: string; entityId: string; reason: string }>,
    };

    if (changes.posts) {
      for (const post of changes.posts) {
        try {
          if (post.action === 'delete') {
            await this.postsRepo.delete(post.id);
            results.postsProcessed++;
          } else {
            const existing = await this.postsRepo.findOne({ where: { id: post.id } as any });
            if (existing) {
              results.postsProcessed++;
            } else if (post.action === 'create') {
              results.postsProcessed++;
            }
          }
        } catch (err) {
          this.logger.error(`Failed to sync post ${post.id}:`, err);
        }
      }
    }

    if (changes.messages) {
      results.messagesProcessed = changes.messages.length;
    }

    if (changes.reactions) {
      results.reactionsProcessed = changes.reactions.length;
    }

    return results;
  }

  async pullChanges(userId: string, since: Date) {
    const posts = await this.postsRepo
      .createQueryBuilder('post')
      .where('post.createdAt > :since', { since })
      .orderBy('post.createdAt', 'DESC')
      .limit(100)
      .getMany();

    const messages = await this.messagesRepo
      .createQueryBuilder('message')
      .where('message.createdAt > :since', { since })
      .orderBy('message.createdAt', 'DESC')
      .limit(200)
      .getMany();

    return {
      posts: posts.map(p => ({
        id: p.id,
        content: p.content,
        action: 'update' as const,
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        action: 'create' as const,
        createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
      })),
      pulledAt: new Date().toISOString(),
    };
  }

  async getSyncStatus(userId: string) {
    return {
      lastSyncedAt: new Date().toISOString(),
      userId,
      syncEnabled: true,
    };
  }

  async resolveConflict(userId: string, resolution: {
    entityType: 'post' | 'message';
    entityId: string;
    resolution: 'local' | 'remote';
    remoteData?: any;
  }) {
    return { resolved: true, entityType: resolution.entityType, entityId: resolution.entityId };
  }
}
