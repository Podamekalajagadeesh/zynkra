import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CulturalFocus {
  LANGUAGES = 'languages',
  TRADITIONS = 'traditions',
  MEMORIES = 'memories',
  HISTORY = 'history',
  CRAFTS = 'crafts',
  MUSIC = 'music',
}

@Entity('cultural_communities')
export class CulturalCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-array',
  })
  focus: CulturalFocus[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  languages?: string[];

  @Column({ type: 'simple-array', nullable: true })
  traditions?: string[];

  @Column({ type: 'integer', default: 0 })
  archivedCount: number;

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('cultural_community_members')
export class CulturalCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CulturalCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: CulturalCommunity;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text', nullable: true })
  role?: string;

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('cultural_archives')
export class CulturalArchive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CulturalCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: CulturalCommunity;

  @Column()
  uploaderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaderId' })
  uploader?: User;

  @Column({
    type: 'enum',
    enum: CulturalFocus,
  })
  type: CulturalFocus;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'text', nullable: true })
  mediaUrl?: string;

  @Column({ type: 'text', nullable: true })
  language?: string;

  @CreateDateColumn()
  createdAt: Date;
}
