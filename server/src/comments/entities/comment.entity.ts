import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { UserGift } from '../../monetization/entities/user-gift.entity';

export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments)
  user: User;

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @OneToMany(() => UserGift, (userGift) => userGift.comment, {
    eager: false,
    onDelete: 'CASCADE',
  })
  awards: UserGift[];

  // Sentiment analysis fields
  @Column({ type: 'varchar', nullable: true })
  sentiment?: SentimentType;

  @Column({ type: 'float', nullable: true })
  sentimentScore?: number;

  @Column({ type: 'float', nullable: true })
  sentimentConfidence?: number;
}