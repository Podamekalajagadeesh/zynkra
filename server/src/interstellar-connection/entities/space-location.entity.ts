import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

export enum SpaceLocationType {
  SPACE_STATION = 'space_station',
  LUNAR_BASE = 'lunar_base',
  MARS_COLONY = 'mars_colony',
  ASTEROID_OUTPOST = 'asteroid_outpost',
  OTHER = 'other',
}

@Entity('space_locations')
export class SpaceLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SpaceLocationType,
  })
  type: SpaceLocationType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  coordinates?: string;

  @Column({ type: 'integer', default: 0 })
  population: number;

  @Column({ type: 'integer', default: 0 })
  latencyMs: number; // Signal latency in milliseconds

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('interstellar_messages')
export class InterstellarMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column({ nullable: true })
  senderLocationId?: string;

  @ManyToOne(() => SpaceLocation, { nullable: true })
  senderLocation?: SpaceLocation;

  @Column({ nullable: true })
  recipientId?: string;

  @Column({ nullable: true })
  recipientLocationId?: string;

  @ManyToOne(() => SpaceLocation, { nullable: true })
  recipientLocation?: SpaceLocation;

  @Column({ type: 'boolean', default: false })
  isBroadcast: boolean;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt?: Date;

  @Column({ type: 'integer', nullable: true })
  travelTimeMs?: number;

  @CreateDateColumn()
  createdAt: Date;
}
