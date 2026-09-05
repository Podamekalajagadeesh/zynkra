import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Post, PostType } from '../posts/entities/post.entity';
import { Media } from '../media/entities/media.entity';
import { User } from '../users/entities/user.entity';
import { Tip } from '../tipping/entities/tip.entity';
import { Order } from '../marketplace/entities/order.entity';
import { OrderItem } from '../marketplace/entities/order-item.entity';
import { Product } from '../marketplace/entities/product.entity';
import { PageView } from './entities/page-view.entity';
import { Follow } from '../users/entities/follow.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { DataPermission } from '../features/account-management/dto/data-permissions.dto';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tip)
    private readonly tipsRepository: Repository<Tip>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(PageView)
    private readonly pageViewsRepository: Repository<PageView>,
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly dataPermissions: DataPermissionsService,
  ) {}

  async getAnalytics(userId: string) {
    await this.dataPermissions.require(userId, DataPermission.ANALYTICS);
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['followers', 'following'] });
    const posts = await this.postsRepository.find({ where: { user: { id: userId } }, relations: ['comments'] });
    
    // Get all products owned by the user
    const userProducts = await this.productsRepository.find({ where: { sellerId: userId } });
    const productIds = userProducts.map(p => p.id);
    
    // Get all completed orders for the user's products
    const orders = await this.ordersRepository.find({
      where: {
        status: 'delivered',
      },
      relations: ['items', 'items.product', 'items.productVariant'],
    });
    
    // Calculate social commerce analytics
    const completedOrders = orders.filter(order => 
      order.items.some(item => productIds.includes(item.product?.id))
    );
    
    const totalRevenue = completedOrders.reduce((acc, order) => acc + Number(order.total), 0);
    const totalOrders = completedOrders.length;
    
    // Get unique customers
    const customerIds = [...new Set(completedOrders.map(order => order.customerId))];
    const uniqueCustomers = customerIds.length;
    
    // Calculate conversion tracking (if we had product views stored with post IDs, we'd use that here)
    // For now, calculate monthly trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const recentOrders = await this.ordersRepository.find({
      where: {
        createdAt: Between(thirtyDaysAgo, new Date()),
        items: {
          product: { sellerId: userId },
        },
        status: 'delivered',
      },
      relations: ['items'],
    });
    
    const monthlyRevenue = recentOrders.reduce((acc, order) => acc + Number(order.total), 0);
    const monthlyOrders = recentOrders.length;
    
    // Product performance
    const productPerformance = userProducts.map(product => {
      const productOrders = orders.filter(order => 
        order.items.some(item => item.product?.id === product.id && order.status === 'delivered')
      );
      const productRevenue = productOrders.reduce((acc, order) => {
        const item = order.items.find(i => i.product?.id === product.id);
        return acc + (item ? Number(item.price) * item.quantity : 0);
      }, 0);
      
      return {
        productId: product.id,
        productName: product.name,
        unitsSold: productOrders.length,
        revenue: productRevenue,
      };
    });
    
    // Calculate customer insights
    const customerAnalytics = {
      totalCustomers: uniqueCustomers,
      repeatCustomers: customerIds.length > 0 ? customerIds.filter(customerId => 
        orders.filter(order => order.customerId === customerId).length > 1
      ).length : 0,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };

    // Post engagement calculations - calculate total likes using reactions
    let totalLikes = 0;
    const postsWithReactions = await this.postsRepository.find({
      where: { user: { id: userId } },
      relations: ['reactions'],
    });
    totalLikes = postsWithReactions.reduce((acc, post) => acc + post.reactions.length, 0);
    
    const totalComments = posts.reduce((acc, post) => acc + post.comments.length, 0);
    const tips = await this.tipsRepository.find({ where: { to: { id: userId } } });
    const totalTips = tips.reduce((acc, tip) => acc + Number(tip.amount), 0);
    
    // Subscriptions revenue
    const subscriptions = await this.subscriptionsRepository.find({
      where: {
        creator: { id: userId },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['creator'],
    });
    const totalSubscriptions = subscriptions.length;

    // Calculate profile analytics metrics: reach, impressions, engagement rate, follower growth
    const totalProfileViews = await this.pageViewsRepository.count({
      where: {
        userId: userId,
        pageType: 'profile',
        viewedAt: Between(sixtyDaysAgo, new Date()),
      },
    });
    
    const lastThirtyDaysProfileViews = await this.pageViewsRepository.count({
      where: {
        userId: userId,
        pageType: 'profile',
        viewedAt: Between(thirtyDaysAgo, new Date()),
      },
    });
    
    const totalPostImpressions = await this.pageViewsRepository.count({
      where: {
        creatorId: userId,
        pageType: 'post',
        viewedAt: Between(sixtyDaysAgo, new Date()),
      },
    });
    
    const lastThirtyDaysPostImpressions = await this.pageViewsRepository.count({
      where: {
        creatorId: userId,
        pageType: 'post',
        viewedAt: Between(thirtyDaysAgo, new Date()),
      },
    });
    
    // Calculate engagement rate
    const totalEngagements = totalLikes + totalComments;
    const totalReach = lastThirtyDaysProfileViews + lastThirtyDaysPostImpressions;
    const engagementRate = totalReach > 0 ? (totalEngagements / totalReach) * 100 : 0;
    
    // Calculate follower growth
    const currentFollowers = user.followers.length;
    const thirtyDaysAgoFollowers = await this.followsRepository.count({
      where: {
        followingId: userId,
        followedAt: Between(sixtyDaysAgo, thirtyDaysAgo),
      },
    });
    const followerGrowth = currentFollowers - thirtyDaysAgoFollowers;
    const followerGrowthRate = thirtyDaysAgoFollowers > 0 ? (followerGrowth / thirtyDaysAgoFollowers) * 100 : 0;
    
    // Calculate audience insights: demographics, active times, location data
    const followers = await this.usersRepository.find({
      where: {
        id: In(user.followers.map(f => f.id)),
      },
      select: ['location', 'lastSeenAt', 'id'],
    });
    
    // Location breakdown
    const locationData = followers.reduce((acc, follower) => {
      if (follower.location) {
        acc[follower.location] = (acc[follower.location] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Active times breakdown (hour of day)
    const activeTimes = followers.reduce((acc, follower) => {
      if (follower.lastSeenAt) {
        const hour = new Date(follower.lastSeenAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      postEngagement: {
        totalLikes,
        totalComments,
        totalEngagements,
      },
      profileAnalytics: {
        reach: lastThirtyDaysProfileViews,
        totalReach: totalProfileViews,
        impressions: lastThirtyDaysPostImpressions,
        totalImpressions: totalPostImpressions,
        engagementRate: engagementRate.toFixed(2),
        followerCount: currentFollowers,
        followerGrowth,
        followerGrowthRate: followerGrowthRate.toFixed(2),
      },
      audienceInsights: {
        locationData,
        activeTimes,
        totalAudience: followers.length,
      },
      audienceDemographics: {
        totalFollowers: user.followers.length,
        totalFollowing: user.following.length,
      },
      revenue: {
        totalTips,
        totalSubscriptions,
        socialCommerceRevenue: totalRevenue,
        monthlyRevenue,
      },
      socialCommerce: {
        totalOrders,
        monthlyOrders,
        uniqueCustomers: customerAnalytics.totalCustomers,
        repeatCustomers: customerAnalytics.repeatCustomers,
        averageOrderValue: customerAnalytics.averageOrderValue,
        productPerformance,
        conversionRate: postsWithReactions.length > 0 ? (totalOrders / postsWithReactions.length) * 100 : 0,
      },
    };
  }

  // ---- Sustainability / carbon footprint tracker ----------------------------

  private static readonly CARBON_FACTORS = {
    storage: 1.5, // g CO2e per GB stored per year
    dataTransfer: 2.0, // g CO2e per GB transferred
    processing: { video: 0.8, image: 0.02, audio: 0.05, text: 0.001 }, // per min / per image / per KB
    streaming: { video: 0.35, image: 0.015, audio: 0.03 }, // g CO2e per view / per min
  };

  // Typical content footprints used when the server does not store exact
  // media size/duration metadata. Kept aligned with client/src/lib/carbonCalculator.ts.
  private static readonly TYPICAL_CONTENT = {
    video: { sizeGB: 0.05, durationMin: 2 },
    image: { sizeGB: 0.002, durationMin: 0 },
    audio: { sizeGB: 0.01, durationMin: 5 },
    text: { sizeGB: 0, textKB: 2 },
  } as const;

  private static readonly PLATFORM_OFFSET_RATE = 0.4;

  private static round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private resolveContentType(post: Post): 'video' | 'image' | 'audio' | 'text' {
    const media: Media[] = (post.media as Media[]) || [];
    if (media.some((m) => m.type === 'video')) return 'video';
    if (media.some((m) => m.type === 'audio')) return 'audio';
    if (media.some((m) => m.type === 'image')) return 'image';
    return 'text';
  }

  private estimatePostEmissions(
    type: 'video' | 'image' | 'audio' | 'text',
    views: number,
  ): { total: number; offset: number; score: number } {
    const f = AnalyticsService.CARBON_FACTORS;
    const t = AnalyticsService.TYPICAL_CONTENT[type];

    const processing =
      type === 'video'
        ? AnalyticsService.TYPICAL_CONTENT[type].durationMin * f.processing.video
        : type === 'image'
          ? f.processing.image
          : type === 'audio'
            ? AnalyticsService.TYPICAL_CONTENT[type].durationMin * f.processing.audio
            : AnalyticsService.TYPICAL_CONTENT[type].textKB * f.processing.text;

    const transfer = t.sizeGB * f.dataTransfer;
    const storage = t.sizeGB * f.storage;
    const streaming =
      type === 'video'
        ? views * f.streaming.video
        : type === 'image'
          ? views * f.streaming.image
          : type === 'audio'
            ? views * f.streaming.audio
            : 0;

    const total = processing + transfer + storage + streaming;
    const offset = total * AnalyticsService.PLATFORM_OFFSET_RATE;

    let score = 100;
    if (type === 'video' && AnalyticsService.TYPICAL_CONTENT[type].durationMin > 1) score -= 10;
    if (t.sizeGB > 0.1) score -= 5;
    return {
      total,
      offset,
      score: Math.max(0, Math.min(100, score)),
    };
  }

  private estimateEmissionsForPostType(
    postType: string,
    views: number,
  ): number {
    const type =
      postType === 'reel' || postType === 'shorts' ? 'video' : 'image';
    return this.estimatePostEmissions(type, views).total;
  }

  async getSustainabilityData(userId: string) {
    await this.dataPermissions.require(userId, DataPermission.ANALYTICS);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.postsRepository.find({
      where: { user: { id: userId } },
      relations: ['media'],
      order: { createdAt: 'DESC' },
    });

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthly = new Map<string, { emissions: number; offset: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.set(`${monthLabels[d.getMonth()]} ${d.getFullYear()}`, { emissions: 0, offset: 0 });
    }

    const breakdown: Record<string, { emissions: number; count: number }> = {};
    const recent: any[] = [];
    let totalG = 0;
    let totalOffsetG = 0;
    let scoreSum = 0;

    for (const post of posts) {
      const type = this.resolveContentType(post);
      const { total, offset, score } = this.estimatePostEmissions(type, post.viewCount || 0);
      const kg = total / 1000;
      const offsetKg = offset / 1000;
      totalG += total;
      totalOffsetG += offset;
      scoreSum += score;

      const created = post.createdAt ? new Date(post.createdAt) : now;
      const bucket = monthly.get(`${monthLabels[created.getMonth()]} ${created.getFullYear()}`);
      if (bucket) {
        bucket.emissions += kg;
        bucket.offset += offsetKg;
      }

      if (!breakdown[type]) breakdown[type] = { emissions: 0, count: 0 };
      breakdown[type].emissions += kg;
      breakdown[type].count += 1;

      if (recent.length < 10) {
        recent.push({
          postId: post.id,
          postType: type,
          createdAt: created.toISOString(),
          emissions: AnalyticsService.round2(kg),
          offset: AnalyticsService.round2(offsetKg),
          netEmissions: AnalyticsService.round2(kg - offsetKg),
          sustainabilityScore: score,
        });
      }
    }

    const { userRank, totalUsers } = await this.computeSustainabilityRank(userId);

    const avgScore = posts.length > 0 ? Math.round(scoreSum / posts.length) : 100;
    const totalOffsetT = totalOffsetG / 1000; // kg
    const nowIso = now.toISOString();

    const achievements = [
      {
        id: 'first-post',
        name: 'First Step',
        description: 'Created your first piece of content',
        unlockedAt: posts.length > 0 ? (user.createdAt ? new Date(user.createdAt).toISOString() : nowIso) : null,
      },
      {
        id: 'eco-warrior',
        name: 'Eco Warrior',
        description: 'Maintained an average sustainability score above 70',
        unlockedAt: avgScore >= 70 ? nowIso : null,
      },
      {
        id: 'carbon-cutter',
        name: 'Carbon Cutter',
        description: 'Reduced your monthly emissions by 50%',
        unlockedAt: null,
      },
      {
        id: 'tree-planter',
        name: 'Tree Planter',
        description: 'Your usage has contributed to planting 10 trees',
        unlockedAt: totalOffsetT >= 250 ? nowIso : null,
      },
    ];

    return {
      totalEmissions: AnalyticsService.round2(totalG / 1000),
      totalOffset: AnalyticsService.round2(totalOffsetG / 1000),
      netEmissions: AnalyticsService.round2((totalG - totalOffsetG) / 1000),
      totalEmissionsSaved: AnalyticsService.round2(totalG / 1000),
      averageSustainabilityScore: avgScore,
      monthlyEmissions: [...monthly.entries()].map(([month, v]) => ({
        month,
        emissions: AnalyticsService.round2(v.emissions),
        offset: AnalyticsService.round2(v.offset),
      })),
      contentBreakdown: Object.entries(breakdown).map(([type, v]) => ({
        type,
        emissions: AnalyticsService.round2(v.emissions),
        count: v.count,
      })),
      userRank,
      totalUsers,
      achievements,
      recentContent: recent,
    };
  }

  private async computeSustainabilityRank(
    userId: string,
  ): Promise<{ userRank: number; totalUsers: number }> {
    const rows = await this.postsRepository
      .createQueryBuilder('post')
      .select('post.user.id', 'userId')
      .addSelect('post.postType', 'postType')
      .addSelect('SUM(post.viewCount)', 'views')
      .addSelect('COUNT(post.id)', 'count')
      .groupBy('post.user.id')
      .addGroupBy('post.postType')
      .getRawMany<{ userId: string; postType: string; views: number; count: number }>();

    const totals = new Map<string, number>();
    for (const row of rows) {
      const views = Number(row.views || 0);
      const perPost = this.estimateEmissionsForPostType(row.postType, views);
      totals.set(row.userId, (totals.get(row.userId) || 0) + perPost);
    }

    const myTotal = totals.get(userId) ?? 0;
    const totalUsers = totals.size;
    let ahead = 0;
    for (const [, t] of totals) {
      if (t > myTotal) ahead += 1;
    }

    return { userRank: ahead + 1, totalUsers };
  }
}