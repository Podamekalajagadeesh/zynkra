import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NeuralContentType {
  THOUGHT = 'thought',
  EMOTION = 'emotion',
  MEMORY = 'memory',
  SENSORY = 'sensory',
}

export enum AccessLevel {
  PRIVATE = 'private',
  FRIENDS = 'friends',
  CONNECTIONS = 'connections',
  PUBLIC = 'public',
}

@Entity('neural_privacy_settings')
export class NeuralPrivacySetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NeuralContentType,
  })
  contentType: NeuralContentType;

  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  accessLevel: AccessLevel;

  @Column({ type: 'json', nullable: true })
  allowedUserIds?: string[];

  @Column({ type: 'boolean', default: false })
  tempAccessEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  tempAccessStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  tempAccessEnd?: Date;

  @Column({ type: 'json', nullable: true })
  tempAccessAllowedUserIds?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
