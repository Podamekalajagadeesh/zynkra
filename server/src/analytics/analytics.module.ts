import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CreatorAnalyticsController } from './creator-analytics.controller';
import { CreatorAnalyticsService } from './creator-analytics.service';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { Tip } from '../tipping/entities/tip.entity';
import { Order } from '../marketplace/entities/order.entity';
import { OrderItem } from '../marketplace/entities/order-item.entity';
import { Product } from '../marketplace/entities/product.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PageView } from './entities/page-view.entity';
import { Follow } from '../users/entities/follow.entity';
import { Article } from '../articles/article.entity';
import { Newsletter, NewsletterSubscriber, NewsletterSubscription } from '../newsletters/newsletter.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment, CourseLesson } from '../courses/course.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post, User, Tip, Order, OrderItem, Product, Subscription, PageView, Follow,
      Article, Newsletter, NewsletterSubscriber, NewsletterSubscription,
      Podcast, Course, CourseEnrollment, CourseLesson, LedgerEntry,
    ])
  ],
  controllers: [AnalyticsController, CreatorAnalyticsController],
  providers: [AnalyticsService, CreatorAnalyticsService],
})
export class AnalyticsModule {}