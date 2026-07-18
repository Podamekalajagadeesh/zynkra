import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NeurodiversityType {
  AUTISM = 'autism',
  ADHD = 'adhd',
  DYSLEXIA = 'dyslexia',
  DYSCALCULIA = 'dyscalculia',
  TOURETTES = 'tourettes',
  OTHER = 'other',
}

export enum InterfacePreset {
  LOW_STIMULUS = 'low_stimulus',
  HIGH_CONTRAST = 'high_contrast',
  SLOW_ANIMATIONS = 'slow_animations',
  LARGE_TEXT = 'large_text',
  CUSTOM = 'custom',
}

@Entity('neurodiverse_communities')
export class NeurodiverseCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-array',
  })
  primaryNeurodiversities: NeurodiversityType[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  recommendedPreset?: InterfacePreset;

  @Column({ type: 'json', nullable: true })
  customSettings?: Record<string, any>;

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

@Entity('neurodiverse_community_members')
export class NeurodiverseCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => NeurodiverseCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: NeurodiverseCommunity;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  userNeurodiversities?: NeurodiversityType[];

  @Column({
    type: 'enum',
    enum: InterfacePreset,
    nullable: true,
  })
  preferredPreset?: InterfacePreset;

  @CreateDateColumn()
  joinedAt: Date;
}
