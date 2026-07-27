import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Podcast, PodcastStatus } from './podcast.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PodcastsService {
  constructor(
    @InjectRepository(Podcast)
    private readonly podcastsRepository: Repository<Podcast>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(authorId: string, data: {
    title: string;
    description: string;
    audioUrl: string;
    coverImage?: string;
    durationSeconds: number;
    tags?: string[];
    status?: 'draft' | 'published';
    isGated?: boolean;
    tokenPrice?: number;
  }): Promise<Podcast> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');

    const slug = this.generateSlug(data.title);

    const podcast = this.podcastsRepository.create({
      slug,
      title: data.title,
      description: data.description,
      audioUrl: data.audioUrl,
      coverImage: data.coverImage || null,
      durationSeconds: data.durationSeconds,
      author,
      status: data.status === 'published' ? PodcastStatus.PUBLISHED : PodcastStatus.DRAFT,
      tags: data.tags || [],
      isGated: data.isGated || false,
      tokenPrice: data.tokenPrice || null,
    });

    return this.podcastsRepository.save(podcast);
  }

  async publish(id: string, userId: string): Promise<Podcast> {
    const podcast = await this.podcastsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!podcast) throw new NotFoundException('Podcast not found');
    if (podcast.author.id !== userId) throw new BadRequestException('Not authorized');

    podcast.status = PodcastStatus.PUBLISHED;
    return this.podcastsRepository.save(podcast);
  }

  async findBySlug(slug: string, incrementPlay = false): Promise<Podcast> {
    const podcast = await this.podcastsRepository.findOne({
      where: { slug, status: PodcastStatus.PUBLISHED },
      relations: ['author'],
    });
    if (!podcast) throw new NotFoundException('Podcast not found');

    if (incrementPlay) {
      podcast.playCount += 1;
      await this.podcastsRepository.save(podcast);
    }

    return podcast;
  }

  async getFeed(options: { page?: number; limit?: number; tag?: string } = {}): Promise<{
    podcasts: Podcast[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, tag } = options;
    const qb = this.podcastsRepository
      .createQueryBuilder('podcast')
      .leftJoinAndSelect('podcast.author', 'author')
      .where('podcast.status = :status', { status: PodcastStatus.PUBLISHED })
      .orderBy('podcast.createdAt', 'DESC');

    if (tag) {
      qb.andWhere('podcast.tags LIKE :tag', { tag: `%${tag}%` });
    }

    const [podcasts, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { podcasts, total, page, limit };
  }

  private generateSlug(title: string): string {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${base}-${Date.now()}`;
  }
}
