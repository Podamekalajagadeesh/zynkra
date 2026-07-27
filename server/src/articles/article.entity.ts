import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum ArticleStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', default: '' })
  subtitle: string;

  @Column({ type: 'text' })
  content: string;

  /** Plain text excerpt for previews and search */
  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status: ArticleStatus;

  /** When to auto-publish (for scheduled articles) */
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  /** When the article was first published */
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @Column('simple-array', { nullable: true })
  tags: string[];

  /** Reading time estimate in minutes */
  @Column({ type: 'int', default: 1 })
  readingTime: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  bookmarkCount: number;

  /** Whether this article is gated behind a subscription/token */
  @Column({ default: false })
  isGated: boolean;

  /** Token price required to unlock gated content */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tokenPrice: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
