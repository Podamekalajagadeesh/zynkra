
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum TagReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('tag_reviews')
export class TagReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  taggedUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  taggingUser: User;

  @Column({
    type: 'enum',
    enum: TagReviewStatus,
    default: TagReviewStatus.PENDING,
  })
  status: TagReviewStatus;
}