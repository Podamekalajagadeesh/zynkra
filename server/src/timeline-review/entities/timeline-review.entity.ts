import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  HIDDEN = 'hidden',
}

@Entity('timeline_review')
export class TimelineReview {
  @PrimaryGeneratedColumn('uuid')
id: string;

  @ManyToOne(() => User)
user: User;

  @ManyToOne(() => Post)
post: Post;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
status: ReviewStatus;

  @CreateDateColumn()
createdAt: Date;
}