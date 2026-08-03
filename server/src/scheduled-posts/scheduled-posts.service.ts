import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduledPost } from './entities/scheduled-post.entity';
import { CreateScheduledPostDto } from './dto/create-scheduled-post.dto';
import { UpdateScheduledPostDto } from './dto/update-scheduled-post.dto';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class ScheduledPostsService {
  private readonly logger = new Logger(ScheduledPostsService.name);

  constructor(
    @InjectRepository(ScheduledPost)
    private readonly scheduledPostsRepository: Repository<ScheduledPost>,
    private readonly postsService: PostsService,
  ) {}

  async create(userId: string, dto: CreateScheduledPostDto): Promise<ScheduledPost> {
    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : this.defaultScheduledFor();
    const post = this.scheduledPostsRepository.create({
      userId,
      content: dto.content,
      mediaUrl: dto.mediaUrl ?? null,
      postType: dto.postType ?? 'feed',
      scheduledFor,
      isOptimalTime: dto.isOptimalTime ?? false,
      visibility: dto.visibility ?? null,
      crossPlatformIds: dto.crossPlatformIds ?? null,
      status: 'scheduled',
    });
    return this.scheduledPostsRepository.save(post);
  }

  async findAll(userId: string): Promise<ScheduledPost[]> {
    return this.scheduledPostsRepository.find({
      where: { userId },
      order: { scheduledFor: 'ASC' },
    });
  }

  async update(userId: string, id: string, dto: UpdateScheduledPostDto): Promise<ScheduledPost> {
    const post = await this.owned(userId, id);
    if (dto.scheduledFor) {
      post.scheduledFor = new Date(dto.scheduledFor);
    }
    Object.assign(post, dto);
    return this.scheduledPostsRepository.save(post);
  }

  async cancel(userId: string, id: string): Promise<void> {
    const post = await this.owned(userId, id);
    await this.scheduledPostsRepository.remove(post);
  }

  private async owned(userId: string, id: string): Promise<ScheduledPost> {
    const post = await this.scheduledPostsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Scheduled post not found');
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('Only the owner can manage a scheduled post');
    }
    return post;
  }

  private defaultScheduledFor(): Date {
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'scheduled-posts-publisher' })
  async publishDue(): Promise<void> {
    const due = await this.scheduledPostsRepository.find({
      where: { status: 'scheduled', scheduledFor: LessThanOrEqual(new Date()) },
    });

    for (const scheduled of due) {
      try {
        await this.postsService.create(
          { userId: scheduled.userId },
          {
            content: scheduled.content,
            postType: normalizePostType(scheduled.postType),
            visibility: scheduled.visibility ?? 'public',
            ...(scheduled.mediaUrl
              ? { media: [{ url: scheduled.mediaUrl, type: inferMediaType(scheduled.mediaUrl) }] }
              : {}),
          },
        );
        scheduled.status = 'published';
        scheduled.publishedAt = new Date();
      } catch (error) {
        this.logger.error(`Failed to publish scheduled post ${scheduled.id}: ${(error as Error).message}`);
        scheduled.status = 'failed';
      }
      await this.scheduledPostsRepository.save(scheduled);
    }
  }
}

function normalizePostType(postType: string): string {
  if (postType === 'feed') return 'post';
  return ['post', 'reel', 'shorts'].includes(postType) ? postType : 'post';
}

function inferMediaType(url: string): 'image' | 'video' | 'audio' {
  const path = url.toLowerCase().split('?')[0];
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(path)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(path)) return 'audio';
  return 'image';
}
