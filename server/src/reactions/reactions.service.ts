import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

const ALLOWED_REACTIONS = new Set(['like', 'love', 'haha', 'wow', 'sad', 'angry']);

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(PostReaction)
    private readonly postReactionsRepository: Repository<PostReaction>,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly webhooksService: WebhooksService
  ) {}

  async addReaction(userId: string, postId: string, reaction: string): Promise<PostReaction> {
    if (!ALLOWED_REACTIONS.has(reaction)) {
      throw new BadRequestException('Unsupported reaction type');
    }

    const post = await this.postsService.findOne(postId, userId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingReaction = await this.postReactionsRepository.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
        reaction,
      },
    });

    if (existingReaction) {
      await this.postReactionsRepository.remove(existingReaction);
      void this.webhooksService.dispatchEvent('reaction.removed', {
        postId,
        userId,
        reaction,
      });
      return existingReaction;
    }

    const newReaction = this.postReactionsRepository.create({
      post,
      user,
      reaction,
    });

    const saved = await this.postReactionsRepository.save(newReaction);
    if (post.user?.id && post.user.id !== userId) {
      await this.notificationsService.createNotification(post.user, NotificationType.LIKE, {
        userId,
        postId,
      });
    }
    void this.webhooksService.dispatchEvent('reaction.created', {
      postId,
      userId,
      reaction,
    });
    return saved;
  }
}
