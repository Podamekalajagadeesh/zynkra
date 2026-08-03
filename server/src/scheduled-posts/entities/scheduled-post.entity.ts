import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ScheduledPostStatus = 'scheduled' | 'published' | 'failed';

@Entity('scheduled_posts')
export class ScheduledPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column('text')
  content: string;

  @Column({ name: 'media_url', type: 'varchar', nullable: true })
  mediaUrl: string | null;

  @Column({ name: 'post_type', type: 'varchar', length: 30, default: 'feed' })
  postType: string;

  @Column({ name: 'scheduled_for', type: 'timestamp with time zone' })
  scheduledFor: Date;

  @Column({ name: 'is_optimal_time', type: 'boolean', default: false })
  isOptimalTime: boolean;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: ScheduledPostStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  visibility: string | null;

  @Column({ name: 'cross_platform_ids', type: 'jsonb', nullable: true })
  crossPlatformIds: string[] | null;

  @Column({ name: 'cross_platform_status', type: 'jsonb', nullable: true })
  crossPlatformStatus: Record<string, 'pending' | 'published' | 'failed'> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamp with time zone', nullable: true })
  publishedAt: Date | null;
}
