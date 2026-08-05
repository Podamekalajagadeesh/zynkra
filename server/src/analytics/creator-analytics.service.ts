import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Article } from '../articles/article.entity';
import { Newsletter, NewsletterSubscriber, NewsletterSubscription } from '../newsletters/newsletter.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment, CourseLesson } from '../courses/course.entity';
import { User } from '../users/entities/user.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';

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
    @InjectRepository(LedgerEntry) private readonly ledgerRepo: Repository<LedgerEntry>,
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

  /**
   * Projects the creator's revenue over the next 30 days by fitting a linear
   * trend to their per-day ledger credits from the last 30 days.
   */
  async forecastRevenue(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const entries = await this.ledgerRepo.find({
      where: {
        user: { id: userId } as any,
        createdAt: MoreThan(since),
        amount: MoreThan(0),
      },
    });

    // Aggregate credits into a per-day revenue series.
    const dayTotals: Record<string, number> = {};
    for (const entry of entries) {
      const day = entry.createdAt.toISOString().slice(0, 10);
      dayTotals[day] = (dayTotals[day] ?? 0) + Number(entry.amount);
    }
    const sortedDays = Object.keys(dayTotals).sort();
    const n = sortedDays.length;
    const points = sortedDays.map((day) => ({
      x: sortedDays.indexOf(day),
      y: dayTotals[day],
    }));

    // Least-squares linear fit over the observed series.
    let meanX = 0;
    let meanY = 0;
    for (const p of points) {
      meanX += p.x;
      meanY += p.y;
    }
    meanX /= n || 1;
    meanY /= n || 1;
    let num = 0;
    let den = 0;
    for (const p of points) {
      num += (p.x - meanX) * (p.y - meanY);
      den += (p.x - meanX) ** 2;
    }
    const slope = den > 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    // Project the next 30 days from the fitted trend.
    let projected30d = 0;
    for (let k = 0; k < 30; k++) {
      projected30d += Math.max(0, slope * (n + k) + intercept);
    }

    // R² — how well the trend explains observed variance.
    let ssRes = 0;
    let ssTot = 0;
    for (const p of points) {
      const predicted = slope * p.x + intercept;
      ssRes += (p.y - predicted) ** 2;
      ssTot += (p.y - meanY) ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const confidence = Math.round(
      Math.max(0, Math.min(100, r2 * 100 * Math.min(1, n / 14))),
    );

    return {
      projected30d: Math.round(projected30d * 100) / 100,
      confidence,
      breakdown: {
        observedDays: n,
        avgDailyRevenue: Math.round(meanY * 100) / 100,
        trendPerDay: Math.round(slope * 100) / 100,
        last30dRevenue:
          Math.round(points.reduce((s, p) => s + p.y, 0) * 100) / 100,
      },
    };
  }
}
