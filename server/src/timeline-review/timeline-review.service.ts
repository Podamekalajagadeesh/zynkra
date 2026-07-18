import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineReview, ReviewStatus } from './entities/timeline-review.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TimelineReviewService {
  constructor(
    @InjectRepository(TimelineReview)
    private readonly timelineReviewRepository: Repository<TimelineReview>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(userId: string) {
    return this.timelineReviewRepository.find({
      where: { user: { id: userId }, status: ReviewStatus.PENDING },
      relations: ['post', 'post.user'],
    });
  }

  async approve(id: string, userId: string) {
    const review = await this.timelineReviewRepository.findOne({ where: { id }, relations: ['user'] });
    if (review.user.id !== userId) {
      throw new UnauthorizedException();
    }
    review.status = ReviewStatus.APPROVED;
    return this.timelineReviewRepository.save(review);
  }

  async hide(id: string, userId: string) {
    const review = await this.timelineReviewRepository.findOne({ where: { id }, relations: ['user'] });
    if (review.user.id !== userId) {
      throw new UnauthorizedException();
    }
    review.status = ReviewStatus.HIDDEN;
    return this.timelineReviewRepository.save(review);
  }

  async createForPost(post: Post, user: User) {
    const review = new TimelineReview();
    review.post = post;
    review.user = user;
    await this.timelineReviewRepository.save(review);

    await this.notificationsService.create(user, NotificationType.TIMELINE_REVIEW, {
      postId: post.id,
      message: `You were tagged in a post by ${post.user.displayName}.`,
    });
  }
}