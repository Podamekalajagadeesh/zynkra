import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { Tip } from '../tipping/entities/tip.entity';
import { Order } from '../marketplace/entities/order.entity';
import { OrderItem } from '../marketplace/entities/order-item.entity';
import { Product } from '../marketplace/entities/product.entity';
import { PageView } from './entities/page-view.entity';
import { Follow } from '../users/entities/follow.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

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
  ) {}

  async getAnalytics(userId: string) {
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
}