import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { PostsService } from '../posts/posts.service';
import { User } from '../users/entities/user.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(PostReaction)
    private readonly postReactionsRepository: Repository<PostReaction>,
    private readonly postsService: PostsService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async addReaction(
    userId: string,
    postId: string,
    reaction: string,
  ): Promise<PostReaction> {
    const post = await this.postsService.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = new User();
    user.id = userId;

    const existingReaction = await this.postReactionsRepository.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
        reaction,
      },
    });

    if (existingReaction) {
      await this.postReactionsRepository.remove(existingReaction);
      return existingReaction;
    }

    const newReaction = this.postReactionsRepository.create({
      post,
      user,
      reaction,
    });

    const saved = await this.postReactionsRepository.save(newReaction);
    void this.webhooksService.dispatchEvent('reaction.created', {
      postId,
      userId,
      reaction,
    });
    return saved;
  }
}