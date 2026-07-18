
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { Post, PostType } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { MemoryEditRevision, MemoryEditType } from './entities/memory-edit-revision.entity';
import { CreateMemoryDto, RealityContext } from './dto/create-memory.dto';
import { PortMemoryDto } from './dto/port-memory.dto';
import { analyzeNeuralAuthenticity } from './deepfake-detection';
import { buildDocumentarySummary } from './documentary-builder';
import { MemoryProject } from './entities/memory-project.entity';
import { buildMemoryProjectSummary } from './memory-projects';

@Injectable()
export class MemoriesService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(MemoryEditRevision)
    private readonly revisionRepository: Repository<MemoryEditRevision>,
    @InjectRepository(MemoryProject)
    private readonly memoryProjectRepository: Repository<MemoryProject>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'memory-time-capsule-unlock' })
  async unlockDueTimeCapsules() {
    const dueCapsules = await this.postRepository.find({
      where: {
        isMemory: true,
        isDraft: true,
        timeCapsuleUnlockAt: LessThanOrEqual(new Date()),
      },
    });

    if (dueCapsules.length === 0) {
      return [];
    }

    const unlockedAt = new Date();
    for (const capsule of dueCapsules) {
      capsule.isDraft = false;
      capsule.timeCapsuleUnlockedAt = unlockedAt;
      capsule.realityContext = capsule.realityContext || RealityContext.NEURAL;
      await this.postRepository.save(capsule);
    }

    return dueCapsules;
  }

  async createMemory(user: User, data: CreateMemoryDto): Promise<Post> {
    const unlockAt = data.timeCapsuleUnlockAt ? new Date(data.timeCapsuleUnlockAt) : null;
    const isScheduled = Boolean(unlockAt && unlockAt.getTime() > Date.now());
    const authenticity = analyzeNeuralAuthenticity({
      content: data.content,
      memoryMetadata: data.memoryMetadata as Record<string, any>,
    });

    const memory = this.postRepository.create({
      content: data.content,
      visibility: data.visibility,
      user,
      postType: PostType.POST,
      isMemory: data.isMemory !== false,
      isDraft: isScheduled,
      memoryMetadata: data.memoryMetadata,
      realityContext: data.realityContext ?? RealityContext.NEURAL,
      timeCapsuleUnlockAt: unlockAt,
      timeCapsuleUnlockedAt: isScheduled ? null : unlockAt ?? new Date(),
      timeCapsuleRecipients: data.timeCapsuleRecipients ?? [],
      timeCapsuleMessage: data.timeCapsuleMessage,
      crossRealityPorts: [],
      authenticityAnalysis: authenticity,
    });

    return this.postRepository.save(memory);
  }

  async getTimeline(user: User): Promise<Post[]> {
    return this.postRepository.find({
      where: { user: { id: user.id }, isMemory: true },
      order: { createdAt: 'DESC' },
      relations: ['user', 'memoryRevisions', 'memoryRevisions.editor'],
    });
  }

  async getFeed(user: User): Promise<Post[]> {
    return this.postRepository.find({
      where: { isMemory: true, isDraft: false },
      order: { createdAt: 'DESC' },
      relations: ['user', 'memoryRevisions', 'memoryRevisions.editor'],
    });
  }

  async getTimeCapsules(user: User): Promise<Post[]> {
    return this.postRepository.find({
      where: { user: { id: user.id }, isMemory: true, isDraft: true },
      order: { timeCapsuleUnlockAt: 'ASC' },
      relations: ['user', 'memoryRevisions', 'memoryRevisions.editor'],
    });
  }

  async getOnThisDay(user: User): Promise<Post[]> {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId: user.id })
      .andWhere('EXTRACT(MONTH FROM post.createdAt) = :month', { month: month + 1 })
      .andWhere('EXTRACT(DAY FROM post.createdAt) = :day', { day })
      .andWhere('EXTRACT(YEAR FROM post.createdAt) != :year', { year: today.getFullYear() })
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return posts;
  }

  async getMemoryRevisions(memoryId: string, user: User) {
    const memory = await this.postRepository.findOne({
      where: { id: memoryId, isMemory: true },
      relations: ['user'],
    });
    if (!memory) {
      throw new NotFoundException('Memory not found');
    }
    if (memory.user.id !== user.id) {
      throw new ForbiddenException('You can only view revisions for your own memories');
    }

    return this.revisionRepository.find({
      where: { memoryId },
      order: { createdAt: 'DESC' },
      relations: ['editor'],
    });
  }

  async createMemoryRevision(
    memoryId: string,
    user: User,
    data: {
      editType: MemoryEditType;
      title?: string;
      annotation?: string;
      sensoryNote?: string;
      sensoryEnhancements?: MemoryEditRevision['sensoryEnhancements'];
      contextNote?: string;
    },
  ) {
    const memory = await this.postRepository.findOne({
      where: { id: memoryId, isMemory: true },
      relations: ['user'],
    });
    if (!memory) {
      throw new NotFoundException('Memory not found');
    }
    if (memory.user.id !== user.id) {
      throw new ForbiddenException('You can only edit your own memories');
    }

    const revision = this.revisionRepository.create({
      memoryId,
      editorId: user.id,
      ...data,
    });
    return this.revisionRepository.save(revision);
  }

  async portMemory(memoryId: string, user: User, data: PortMemoryDto): Promise<Post> {
    const memory = await this.postRepository.findOne({
      where: { id: memoryId, isMemory: true },
      relations: ['user'],
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    if (memory.user.id !== user.id) {
      throw new ForbiddenException('You can only port your own memories');
    }

    const portEvent = {
      id: randomUUID(),
      sourceReality: data.sourceReality ?? memory.realityContext ?? RealityContext.NEURAL,
      targetReality: data.targetReality,
      contextNote: data.contextNote,
      fidelity: data.fidelity ?? 'full',
      portedAt: new Date().toISOString(),
      contentSnapshot: memory.content,
      memoryMetadataSnapshot: memory.memoryMetadata,
      timeCapsuleUnlockAt: memory.timeCapsuleUnlockAt,
      timeCapsuleRecipients: memory.timeCapsuleRecipients ?? [],
    };

    memory.realityContext = data.targetReality;
    memory.crossRealityPorts = [...(memory.crossRealityPorts ?? []), portEvent];

    return this.postRepository.save(memory);
  }

  async getMemoryPorts(memoryId: string, user: User) {
    const memory = await this.postRepository.findOne({
      where: { id: memoryId, isMemory: true },
      relations: ['user'],
    });

    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    if (memory.user.id !== user.id) {
      throw new ForbiddenException('You can only view port history for your own memories');
    }

    return memory.crossRealityPorts ?? [];
  }

  async createMemoryProject(user: User, payload: { title: string; topic?: string; description?: string; memoryIds?: string[]; contributorNames?: string[] }) {
    const summary = buildMemoryProjectSummary({
      title: payload.title,
      topic: payload.topic ?? 'shared memories',
      description: payload.description ?? 'A collaborative archive of memories.',
      memoryCount: payload.memoryIds?.length ?? 0,
      contributorNames: payload.contributorNames ?? [user.displayName ?? user.username ?? 'You'],
    });

    const project = this.memoryProjectRepository.create({
      title: summary.title,
      topic: payload.topic,
      description: payload.description,
      summary: summary.summary,
      memoryIds: payload.memoryIds ?? [],
      contributorIds: [user.id],
      contributorNames: summary.contributorNames,
      visibility: 'public',
      creator: user,
      creatorId: user.id,
      metadata: { source: 'memories' },
    });

    return this.memoryProjectRepository.save(project);
  }

  async getMemoryProjects(user: User): Promise<MemoryProject[]> {
    return this.memoryProjectRepository.find({
      where: { visibility: 'public' },
      order: { createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async createDocumentary(user: User, payload: { eventName: string; title?: string; memoryIds?: string[]; participantNames?: string[] }) {
    const memories = await this.postRepository.find({
      where: payload.memoryIds?.length ? { id: payload.memoryIds as any, isMemory: true } : { isMemory: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const selectedMemories = memories.slice(0, 8);
    const documentary = buildDocumentarySummary({
      title: payload.title,
      eventName: payload.eventName,
      participantNames: payload.participantNames,
      memories: selectedMemories.map((memory) => ({
        content: memory.content,
        authorName: memory.user?.displayName ?? memory.user?.username,
        memoryMetadata: memory.memoryMetadata as Record<string, any>,
      })),
    });

    return {
      ...documentary,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      memories: selectedMemories.map((memory) => ({
        id: memory.id,
        content: memory.content,
        authorName: memory.user?.displayName ?? memory.user?.username,
      })),
    };
  }
}