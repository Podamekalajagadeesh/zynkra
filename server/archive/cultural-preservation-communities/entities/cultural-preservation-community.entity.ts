import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PreservationFocus {
  LANGUAGE_ARCHIVE = 'language_archive',
  TRADITION_ARCHIVE = 'tradition_archive',
  MEMORY_ARCHIVE = 'memory_archive',
  ORAL_HISTORY = 'oral_history',
  CULTURAL_EDUCATION = 'cultural_education',
}

export enum ArchiveMaterialType {
  AUDIO = 'audio',
  VIDEO = 'video',
  TEXT = 'text',
  IMAGE = 'image',
  STORY = 'story',
  TRANSLATION = 'translation',
}

@Entity('cultural_preservation_communities')
export class CulturalPreservationCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-array',
  })
  focusAreas: PreservationFocus[];

  @Column({ type: 'simple-array', nullable: true })
  languages?: string[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  archiveMethods?: string[];

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @OneToMany(() => CulturalArchiveEntry, (entry) => entry.community)
  archiveEntries?: CulturalArchiveEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('cultural_preservation_community_members')
export class CulturalPreservationCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CulturalPreservationCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: CulturalPreservationCommunity;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text', nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  preferredLanguage?: string;

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('cultural_archive_entries')
export class CulturalArchiveEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CulturalPreservationCommunity, (community) => community.archiveEntries)
  @JoinColumn({ name: 'communityId' })
  community?: CulturalPreservationCommunity;

  @Column({ nullable: true })
  authorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author?: User;

  @Column({ type: 'enum', enum: ArchiveMaterialType })
  materialType: ArchiveMaterialType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  language?: string;

  @Column({ type: 'text', nullable: true })
  sourceOrTranscript?: string;

  @Column({ type: 'text', nullable: true })
  mediaUrl?: string;

  @CreateDateColumn()
  createdAt: Date;
}