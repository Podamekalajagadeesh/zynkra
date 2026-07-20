import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PostReaction } from './post-reaction.entity';
import { Report } from '../../reports/entities/report.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Tag } from '../../tags/tag.entity';
import { Poll } from '../../polls/entities/poll.entity';
import { Bookmark } from '../../bookmarks/entities/bookmark.entity';
import { Watchlist } from '../../bookmarks/entities/watchlist.entity';
import { Media } from '../../media/entities/media.entity';
import { Place } from '../../places/entities/place.entity';
import { ReelEffect } from '../../reels/entities/reel-effect.entity';
import { Page } from '../../pages/entities/page.entity';
import { UserGift } from '../../monetization/entities/user-gift.entity';
import { MemoryEditRevision } from '../../memories/entities/memory-edit-revision.entity';

export enum PostType {
  POST = 'post',
  REEL = 'reel',
}

export enum PostVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PROFILE_ONLY = 'profile_only',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.POST,
  })
  postType: PostType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipfsCid: string;

  @Column('text', { nullable: true })
  content: string;

  @Column('text', { nullable: true })
  encryptedContent: string; // Stores E2EE encrypted content for posts/stories

  @Column({ type: 'boolean', default: false })
  isEncrypted: boolean; // Flag to indicate if content is E2EE encrypted

  @OneToMany(() => Media, (media) => media.post, { cascade: true, eager: true })
  media: Media[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  filter: string;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ type: 'boolean', default: false })
  tokenGated: boolean;

  @Column({ type: 'boolean', default: false })
  subscriptionGated: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requiredTokenBalance: string;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'boolean', default: false })
  reviewed: boolean;

  @Column({ type: 'boolean', default: true })
  showLikes: boolean;

  @Column({ type: 'boolean', default: false })
  isSensitive: boolean;

  @Column({ type: 'boolean', default: false })
  enableScreenshotProtection: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinnedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationName: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activity: string;

  @Column({ type: 'jsonb', nullable: true })
  stickers: { url: string; x: number; y: number }[];

  @Column({ type: 'jsonb', nullable: true })
  productTags: { product_id: string; x: number; y: number }[];

  @Column({ type: 'jsonb', nullable: true })
  eventTags: { event_id: string; x: number; y: number }[];

  @Column({ type: 'jsonb', nullable: true })
  musicTags: { music_id: string; x: number; y: number }[];

  @Column({ type: 'jsonb', nullable: true })
  autoTags: { 
    id: string;
    name: string;
    category: 'topic' | 'genre' | 'format';
    confidence: number;
  }[]; // AI-generated auto-tags for content categorization

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_collaborators',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  collaborators: User[];

  @Column({ type: 'boolean', default: false })
  isDraft: boolean;

  @Column({ type: 'boolean', default: false })
  isMemory: boolean;

  @Column({ type: 'varchar', length: 20, default: 'neural' })
  realityContext: string;

  @Column({ type: 'jsonb', nullable: true })
  memoryMetadata: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  timeCapsuleUnlockAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  timeCapsuleUnlockedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  timeCapsuleRecipients: string[];

  @Column({ type: 'text', nullable: true })
  timeCapsuleMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  crossRealityPorts: Record<string, any>[];

  @Column({ type: 'jsonb', nullable: true })
  authenticityAnalysis: Record<string, any>;

  @OneToMany(() => MemoryEditRevision, (revision) => revision.memory)
  memoryRevisions: MemoryEditRevision[];

  @OneToMany(() => Report, (report) => report.post, { onDelete: 'CASCADE' })
  reports: Report[];

  @OneToMany(() => PostReaction, (reaction) => reaction.post, {
    eager: true,
    onDelete: 'CASCADE',
  })
  reactions: PostReaction[];

  @OneToMany(() => Comment, (comment) => comment.post, {
    eager: true,
    onDelete: 'CASCADE',
  })
  comments: Comment[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.post)
  bookmarks: Bookmark[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.post)
  watchlist: Watchlist[];

  @ManyToMany(() => User)
  @JoinTable()
  taggedUsers: User[];

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ManyToOne(() => Post, (post) => post.reposts, { nullable: true, onDelete: 'CASCADE' })
  repostedFrom: Post;

  @OneToMany(() => Post, (post) => post.repostedFrom)
  reposts: Post[];

  // Quote post: own content referencing another post (X-style quote).
  // SET NULL so quotes survive deletion of the quoted post ("post unavailable").
  @ManyToOne(() => Post, (post) => post.quotes, { nullable: true, onDelete: 'SET NULL' })
  quotedPost: Post;

  @OneToMany(() => Post, (post) => post.quotedPost)
  quotes: Post[];

  @Column({ type: 'int', default: 0 })
  quoteCount: number;

  @Column({ type: 'int', default: 0 })
  repostCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @ManyToOne(() => Place, (place) => place.posts, { nullable: true, eager: true })
  place: Place;

  @OneToMany(() => Poll, (poll) => poll.post, { cascade: true, eager: true })
  poll: Poll[];

  @ManyToOne(() => Page, (page) => page.posts, { nullable: true })
  page: Page;

  @ManyToOne(() => ReelEffect, { nullable: true, eager: true })
  reelEffect: ReelEffect;

  @Column({ default: false })
  isBerealPost: boolean;

  @OneToMany(() => UserGift, (userGift) => userGift.post, {
    eager: false,
    onDelete: 'CASCADE',
  })
  awards: UserGift[];
}