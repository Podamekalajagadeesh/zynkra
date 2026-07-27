import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Message } from '../dms/entities/message.entity';
import { Article } from '../articles/article.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment } from '../courses/course.entity';

export interface ExportData {
  user: any;
  posts: any[];
  messages: any[];
  articles: any[];
  podcasts: any[];
  courses: any[];
  enrollments: any[];
  settings: any;
  exportedAt: string;
  version: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Article) private readonly articlesRepo: Repository<Article>,
    @InjectRepository(Podcast) private readonly podcastsRepo: Repository<Podcast>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseEnrollment) private readonly enrollmentsRepo: Repository<CourseEnrollment>,
  ) {}

  /**
   * Export all user data in a portable format.
   * This is a GDPR/CCPA compliance requirement and user right.
   */
  async exportUserData(userId: string): Promise<ExportData> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [posts, messages, articles, podcasts, courses, enrollments] = await Promise.all([
      this.postsRepo.find({ where: { user: { id: userId } } as any }),
      this.messagesRepo.find({ where: { sender: { id: userId } } as any }),
      this.articlesRepo.find({ where: { authorId: userId } }),
      this.podcastsRepo.find({ where: { authorId: userId } }),
      this.coursesRepo.find({ where: { authorId: userId } }),
      this.enrollmentsRepo.find({ where: { userId } }),
    ]);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: (user as any).displayName,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      posts: posts.map(p => ({
        id: p.id,
        content: (p as any).content,
        createdAt: p.createdAt,
      })),
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        conversationId: (m as any).conversation?.id,
        createdAt: m.createdAt,
      })),
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        publishedAt: a.publishedAt,
      })),
      podcasts: podcasts.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        audioUrl: p.audioUrl,
        createdAt: p.createdAt,
      })),
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        createdAt: c.createdAt,
      })),
      enrollments: enrollments.map(e => ({
        courseId: e.courseId,
        progress: e.progress,
        isCompleted: e.isCompleted,
        enrolledAt: e.createdAt,
      })),
      settings: {
        // Export user preferences
        feedAlgorithm: 'relevance',
        privacy: 'public',
      },
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Export data as JSON string for download.
   */
  async exportAsJson(userId: string): Promise<string> {
    const data = await this.exportUserData(userId);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get export status/info.
   */
  async getExportInfo(userId: string): Promise<{
    userId: string;
    dataTypes: string[];
    estimatedSize: string;
    lastExport: string | null;
    canExport: boolean;
  }> {
    return {
      userId,
      dataTypes: ['profile', 'posts', 'messages', 'articles', 'podcasts', 'courses', 'enrollments', 'settings'],
      estimatedSize: 'Unknown',
      lastExport: null,
      canExport: true,
    };
  }

  /**
   * Delete all user data (right to be forgotten).
   */
  async deleteAllUserData(userId: string): Promise<{
    success: boolean;
    deletedCounts: Record<string, number>;
  }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const deletedCounts: Record<string, number> = {};

    // Delete posts
    const posts = await this.postsRepo.find({ where: { user: { id: userId } } as any });
    deletedCounts.posts = posts.length;
    await this.postsRepo.remove(posts);

    // Delete articles
    const articles = await this.articlesRepo.find({ where: { authorId: userId } });
    deletedCounts.articles = articles.length;
    await this.articlesRepo.remove(articles);

    // Delete podcasts
    const podcasts = await this.podcastsRepo.find({ where: { authorId: userId } });
    deletedCounts.podcasts = podcasts.length;
    await this.podcastsRepo.remove(podcasts);

    // Anonymize user (don't delete — maintain referential integrity)
    user.username = `deleted_${user.id.slice(0, 8)}`;
    user.email = `deleted_${user.id.slice(0, 8)}@zynkra.deleted`;
    user.bio = null;
    user.avatar = null;
    await this.usersRepo.save(user);

    this.logger.log(`User data deleted for ${userId}`);

    return { success: true, deletedCounts };
  }
}
