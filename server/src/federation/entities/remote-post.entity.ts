import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RemoteUser } from './remote-user.entity';
import { RemoteInstance } from './remote-instance.entity';

export enum ActivityType {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow',
  LIKE = 'Like',
  ANNOUNCE = 'Announce',
  ACCEPT = 'Accept',
  REJECT = 'Reject',
}

@Entity('federated_posts')
export class RemotePost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  activityId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.CREATE,
  })
  activityType: ActivityType;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  inReplyToId: string;

  @ManyToOne(() => RemoteUser, (user) => user.posts)
  author: RemoteUser;

  @ManyToOne(() => RemoteInstance)
  instance: RemoteInstance;

  @Column('simple-array', { nullable: true })
  mediaUrls: string[];

  @Column('simple-array', { nullable: true })
  mentions: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  shareCount: number;

  @Column({ nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}