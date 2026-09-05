import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagReview, TagReviewStatus } from './entities/tag-review.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfileReviewService {
  constructor(
    @InjectRepository(TagReview)
    private readonly tagReviewRepository: Repository<TagReview>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createForPost(post: Post, taggedUser: User, taggingUser: User): Promise<TagReview> {
    const tagReview = this.tagReviewRepository.create({
      post,
      taggedUser,
      taggingUser,
    });

    return this.tagReviewRepository.save(tagReview);
  }

  async getPending(userId: string): Promise<TagReview[]> {
    return this.tagReviewRepository.find({
      where: { taggedUser: { id: userId }, status: TagReviewStatus.PENDING },
      relations: ['post', 'post.user', 'taggingUser'],
    });
  }

  async approve(tagReviewId: string, userId: string): Promise<TagReview> {
    const tagReview = await this.tagReviewRepository.findOne({
      where: { id: tagReviewId, taggedUser: { id: userId } },
      relations: ['post', 'taggedUser'],
    });
    if (!tagReview) {
      throw new Error('Tag review not found');
    }

    tagReview.status = TagReviewStatus.APPROVED;
    const post = await this.postRepository.findOne({ where: { id: tagReview.post.id }, relations: ['taggedUsers'] });
    if (post && !(post.taggedUsers ?? []).some((taggedUser) => taggedUser.id === userId)) {
      post.taggedUsers = [...(post.taggedUsers ?? []), tagReview.taggedUser];
      await this.postRepository.save(post);
    }
    return this.tagReviewRepository.save(tagReview);
  }

  async reject(tagReviewId: string, userId: string): Promise<TagReview> {
    const tagReview = await this.tagReviewRepository.findOne({ where: { id: tagReviewId, taggedUser: { id: userId } } });
    if (!tagReview) {
      throw new Error('Tag review not found');
    }

    tagReview.status = TagReviewStatus.REJECTED;
    return this.tagReviewRepository.save(tagReview);
  }
}