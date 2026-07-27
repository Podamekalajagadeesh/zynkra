import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Article } from '../articles/article.entity';
import { Newsletter, NewsletterSubscriber, NewsletterSubscription } from '../newsletters/newsletter.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment, CourseLesson } from '../courses/course.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CreatorAnalyticsService {
  private readonly logger = new Logger(CreatorAnalyticsService.name);

  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(Article) private readonly articlesRepo: Repository<Article>,
    @InjectRepository(Newsletter) private readonly newslettersRepo: Repository<Newsletter>,
    @InjectRepository(NewsletterSubscription) private readonly subsRepo: Repository<NewsletterSubscription>,
    @InjectRepository(Podcast) private readonly podcastsRepo: Repository<Podcast>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseEnrollment) private readonly enrollmentsRepo: Repository<CourseEnrollment>,
    @InjectRepository(CourseLesson) private readonly lessonsRepo: Repository<CourseLesson>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Get comprehensive creator analytics for a user.
   */
  async getCreatorDashboard(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const [posts, articles, newsletters, podcasts, courses] = await Promise.all([
      this.postsRepo.find({ where: { user: { id: userId } as any } }),
      this.articlesRepo.find({ where: { authorId: userId } }),
      this.newslettersRepo.find({ where: { authorId: userId } }),
      this.podcastsRepo.find({ where: { authorId: userId } }),
      this.coursesRepo.find({ where: { authorId: userId } }),
    ]);

    // Aggregated stats
    const totalPosts = posts.length;
    const totalArticles = articles.length;
    const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0)
      + articles.reduce((sum, a) => sum + a.viewCount, 0);

    // Newsletter stats
    const totalSubscribers = await this.subsRepo.count({ where: { authorId: userId } });
    const newslettersSent = newsletters.filter(n => n.status === 'sent').length;

    // Podcast stats
    const totalPlays = podcasts.reduce((sum, p) => sum + p.playCount, 0);

    // Course stats
    const courseIds = courses.map(c => c.id);
    const totalEnrollments = courseIds.length > 0
      ? await this.enrollmentsRepo
          .createQueryBuilder('enrollment')
          .where('enrollment.courseId IN (:...ids)', { ids: courseIds })
          .getCount()
      : 0;

    return {
      overview: {
        totalPosts,
        totalArticles,
        totalViews,
        totalSubscribers,
        newslettersSent,
        totalPlays,
        coursesCreated: courses.length,
        totalEnrollments,
      },
      topContent: {
        posts: posts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5),
        articles: articles.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
        podcasts: podcasts.sort((a, b) => b.playCount - a.playCount).slice(0, 5),
      },
      recentActivity: {
        posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        articles: articles.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()).slice(0, 5),
      },
    };
  }

  /**
   * Get newsletter analytics.
   */
  async getNewsletterAnalytics(userId: string) {
    const newsletters = await this.newslettersRepo.find({ where: { authorId: userId } });
    const sent = newsletters.filter(n => n.status === 'sent');

    const totalSent = sent.length;
    const totalSubscribers = await this.subsRepo.count({ where: { authorId: userId } });

    const avgOpenRate = sent.length > 0
      ? sent.reduce((sum, n) => sum + (n.openCount || 0), 0) / sent.length
      : 0;

    return {
      totalSent,
      totalSubscribers,
      avgOpenRate: Math.round(avgOpenRate),
      recentNewsletters: newsletters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    };
  }

  /**
   * Get course analytics.
   */
  async getCourseAnalytics(userId: string) {
    const courses = await this.coursesRepo.find({ where: { authorId: userId } });

    let totalEnrollments = 0;
    let totalCompleted = 0;
    let avgProgress = 0;

    for (const course of courses) {
      const enrollments = await this.enrollmentsRepo.find({ where: { courseId: course.id } });
      totalEnrollments += enrollments.length;
      totalCompleted += enrollments.filter(e => e.isCompleted).length;
      avgProgress += enrollments.reduce((sum, e) => sum + e.progress, 0) / Math.max(enrollments.length, 1);
    }

    const overallAvgProgress = courses.length > 0 ? Math.round(avgProgress / courses.length) : 0;

    return {
      totalCourses: courses.length,
      totalEnrollments,
      totalCompleted,
      avgProgress: overallAvgProgress,
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        enrollmentCount: c.enrollmentCount,
        lessonCount: c.lessonCount,
      })),
    };
  }

  /**
   * Get podcast analytics.
   */
  async getPodcastAnalytics(userId: string) {
    const podcasts = await this.podcastsRepo.find({ where: { authorId: userId } });
    const published = podcasts.filter(p => p.status === 'published');
    const totalPlays = podcasts.reduce((sum, p) => sum + p.playCount, 0);

    return {
      totalEpisodes: podcasts.length,
      publishedEpisodes: published.length,
      totalPlays,
      avgPlaysPerEpisode: published.length > 0 ? Math.round(totalPlays / published.length) : 0,
      recentEpisodes: podcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    };
  }
}
