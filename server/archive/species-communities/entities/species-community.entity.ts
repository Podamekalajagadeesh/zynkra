import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ParticipantType {
  HUMAN = 'human',
  DOMESTIC_ANIMAL = 'domestic_animal',
  WILD_ANIMAL = 'wild_animal',
  AI_ENTITY = 'ai_entity',
}

export enum AnimalSpecies {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  HORSE = 'horse',
  RABBIT = 'rabbit',
  DOLPHIN = 'dolphin',
  APE = 'ape',
  OTHER = 'other',
}

@Entity('species_communities')
export class SpeciesCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-array',
  })
  includedSpecies: ParticipantType[];

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  animalSpecies?: AnimalSpecies[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  communicationTools?: string[];

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

@Entity('species_community_members')
export class SpeciesCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => SpeciesCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: SpeciesCommunity;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: ParticipantType,
  })
  participantType: ParticipantType;

  @Column({
    type: 'enum',
    enum: AnimalSpecies,
    nullable: true,
  })
  animalSpecies?: AnimalSpecies;

  @Column({ type: 'text', nullable: true })
  participantName?: string;

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('species_messages')
export class SpeciesMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => SpeciesCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: SpeciesCommunity;

  @Column({ nullable: true })
  senderId?: string;

  @ManyToOne(() => SpeciesCommunityMember, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: SpeciesCommunityMember;

  @Column({
    type: 'enum',
    enum: ParticipantType,
  })
  senderType: ParticipantType;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
