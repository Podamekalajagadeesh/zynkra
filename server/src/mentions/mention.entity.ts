
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'mentioned_by_id' })
  mentionedBy: User;

  @Column({ name: 'mentioned_by_id' })
  mentionedById: string;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'post_id', nullable: true })
  postId: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'comment_id', nullable: true })
  commentId: string;

  @Column({
    type: 'varchar',
    enum: SentimentType,
    nullable: true,
  })
  sentiment: SentimentType;

  @Column({ type: 'float', nullable: true })
  sentimentScore: number;

  @Column({ type: 'float', nullable: true })
  sentimentConfidence: number;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}