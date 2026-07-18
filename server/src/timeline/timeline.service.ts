import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineReview, TimelineReviewStatus } from './timeline-review.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineReview)
    private readonly timelineReviewRepository: Repository<TimelineReview>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPendingReview(userId: string): Promise<TimelineReview[]> {
    return this.timelineReviewRepository.find({
      where: { user: { id: userId }, status: TimelineReviewStatus.PENDING },
      relations: ['post', 'post.user'],
    });
  }

  async approvePost(reviewId: string): Promise<TimelineReview> {
    const review = await this.timelineReviewRepository.findOne({where: {id: reviewId}});
    if (review) {
      review.status = TimelineReviewStatus.APPROVED;
      return this.timelineReviewRepository.save(review);
    }
  }

  async hidePost(reviewId: string): Promise<TimelineReview> {
    const review = await this.timelineReviewRepository.findOne({where: {id: reviewId}});
    if (review) {
      review.status = TimelineReviewStatus.HIDDEN;
      return this.timelineReviewRepository.save(review);
    }
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