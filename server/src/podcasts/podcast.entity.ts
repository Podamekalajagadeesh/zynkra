import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum PodcastStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('podcasts')
export class Podcast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ nullable: true })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'enum', enum: PodcastStatus, default: PodcastStatus.DRAFT })
  status: PodcastStatus;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  playCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ default: false })
  isGated: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tokenPrice: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
