import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StoryElement } from './story-element.entity';

import { StoryReaction } from './story-reaction.entity';
import { StoryReply } from './story-reply.entity';
import { StoryView } from './story-view.entity';

export enum StoryAudience {
  PUBLIC = 'public',
  CLOSE_FRIENDS = 'close_friends',
}

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StoryAudience,
    default: StoryAudience.PUBLIC,
  })
  audience: StoryAudience;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  mediaUrl: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ type: 'jsonb', nullable: true })
  backgroundOptions: { type: 'color' | 'gradient'; values: string[] };

  @Column({ nullable: true })
  arFilterName: string;

  @Column({ type: 'jsonb', nullable: true })
  music: { artist: string; song: string; url: string };

  @Column({ default: false })
  isBoosted: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.stories, { eager: true })
  user: User;

  @OneToMany(() => StoryElement, (element) => element.story, { cascade: true, eager: true })
  elements: StoryElement[];

  @OneToMany(() => StoryReaction, (reaction) => reaction.story)
  reactions: StoryReaction[];

  @OneToMany(() => StoryReply, (reply) => reply.story)
  replies: StoryReply[];

  @OneToMany(() => StoryView, (view) => view.story)
  views: StoryView[];
}