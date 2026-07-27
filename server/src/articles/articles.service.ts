import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './article.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    authorId: string,
    data: {
      title: string;
      subtitle?: string;
      content: string;
      tags?: string[];
      coverImage?: string;
      status?: 'draft' | 'scheduled';
      scheduledAt?: string;
      isGated?: boolean;
      tokenPrice?: number;
    },
  ): Promise<Article> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');

    const slug = this.generateSlug(data.title);
    const readingTime = this.calculateReadingTime(data.content);

    const article = this.articlesRepository.create({
      slug,
      title: data.title,
      subtitle: data.subtitle || '',
      content: data.content,
      excerpt: this.plainTextExcerpt(data.content),
      coverImage: data.coverImage || null,
      author,
      status: data.status === 'scheduled' ? ArticleStatus.SCHEDULED : ArticleStatus.DRAFT,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      publishedAt: data.status === 'scheduled' ? null : new Date(),
      tags: data.tags || [],
      readingTime,
      isGated: data.isGated || false,
      tokenPrice: data.tokenPrice || null,
    });

    return this.articlesRepository.save(article);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      subtitle: string;
      content: string;
      tags: string[];
      coverImage: string;
      isGated: boolean;
      tokenPrice: number | null;
    }>,
  ): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.author.id !== userId) throw new BadRequestException('You can only edit your own articles');

    if (data.title !== undefined) {
      article.slug = this.generateSlug(data.title);
      article.title = data.title;
    }
    if (data.subtitle !== undefined) article.subtitle = data.subtitle;
    if (data.content !== undefined) {
      article.content = data.content;
      article.excerpt = this.plainTextExcerpt(data.content);
      article.readingTime = this.calculateReadingTime(data.content);
    }
    if (data.tags !== undefined) article.tags = data.tags;
    if (data.coverImage !== undefined) article.coverImage = data.coverImage;
    if (data.isGated !== undefined) article.isGated = data.isGated;
    if (data.tokenPrice !== undefined) article.tokenPrice = data.tokenPrice;

    return this.articlesRepository.save(article);
  }

  async publish(id: string, userId: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.author.id !== userId) throw new BadRequestException('You can only publish your own articles');

    article.status = ArticleStatus.PUBLISHED;
    article.publishedAt = new Date();

    return this.articlesRepository.save(article);
  }

  async archive(id: string, userId: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.author.id !== userId) throw new BadRequestException('You can only archive your own articles');

    article.status = ArticleStatus.ARCHIVED;

    return this.articlesRepository.save(article);
  }

  async findBySlug(slug: string, incrementView = false): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { slug, status: ArticleStatus.PUBLISHED },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');

    if (incrementView) {
      article.viewCount += 1;
      await this.articlesRepository.save(article);
    }

    return article;
  }

  async findById(id: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async getFeed(options: { page?: number; limit?: number; tag?: string; authorId?: string } = {}): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, tag, authorId } = options;
    const qb = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC');

    if (tag) {
      qb.andWhere('article.tags LIKE :tag', { tag: `%${tag}%` });
    }
    if (authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId });
    }

    const [articles, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { articles, total, page, limit };
  }

  async getUserDrafts(authorId: string): Promise<Article[]> {
    return this.articlesRepository.find({
      where: { authorId, status: ArticleStatus.DRAFT },
      order: { updatedAt: 'DESC' },
    });
  }

  async deleteArticle(id: string, userId: string): Promise<void> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.author.id !== userId) throw new BadRequestException('You can only delete your own articles');

    await this.articlesRepository.remove(article);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${Date.now()}`;
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  private plainTextExcerpt(content: string): string {
    return content
      .replace(/<[^>]+>/g, '')
      .slice(0, 200)
      .trim();
  }
}
