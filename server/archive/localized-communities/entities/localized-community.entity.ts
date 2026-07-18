import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CommunityType {
  NEIGHBORHOOD = 'neighborhood',
  CITY = 'city',
  DISTRICT = 'district',
  LOCAL_CLUB = 'local_club',
}

@Entity('localized_communities')
export class LocalizedCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CommunityType,
  })
  type: CommunityType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  locationName?: string;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({ type: 'float', default: 1.0 })
  radiusKm?: number;

  @Column({ type: 'json', nullable: true })
  digitalFeatures?: string[];

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

@Entity('localized_community_members')
export class LocalizedCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => LocalizedCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: LocalizedCommunity;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text', nullable: true })
  localRole?: string;

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('local_meetups')
export class LocalMeetup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => LocalizedCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: LocalizedCommunity;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'text', nullable: true })
  meetupLocation?: string;

  @Column({ type: 'json', nullable: true })
  coordinates?: { lat: number; lng: number };

  @Column({ type: 'integer', default: 0 })
  attendeeCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
