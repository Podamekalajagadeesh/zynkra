import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

export enum TimelineReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  HIDDEN = 'hidden',
}

@Entity()
export class TimelineReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Post, (post) => post.id)
  post: Post;

  @Column({
    type: 'enum',
    enum: TimelineReviewStatus,
    default: TimelineReviewStatus.PENDING,
  })
  status: TimelineReviewStatus;

  @CreateDateColumn()
  createdAt: Date;
}