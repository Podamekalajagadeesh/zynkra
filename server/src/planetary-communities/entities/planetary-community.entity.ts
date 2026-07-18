import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GlobalChallenge {
  CLIMATE_CHANGE = 'climate_change',
  INEQUALITY = 'inequality',
  WORLD_HUNGER = 'world_hunger',
  GLOBAL_HEALTH = 'global_health',
  EDUCATION = 'education',
  PEACE = 'peace',
}

@Entity('planetary_communities')
export class PlanetaryCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: GlobalChallenge,
  })
  focusChallenge: GlobalChallenge;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  goals?: string[];

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

@Entity('planetary_community_members')
export class PlanetaryCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => PlanetaryCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: PlanetaryCommunity;

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
