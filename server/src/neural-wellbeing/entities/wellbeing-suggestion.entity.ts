import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SuggestionType {
  BREAK = 'break',
  RELAXATION = 'relaxation',
  SOCIAL = 'social',
  EXERCISE = 'exercise',
  DISCONNECT = 'disconnect',
}

export enum SuggestionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
  COMPLETED = 'completed',
}

@Entity('wellbeing_suggestions')
export class WellbeingSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SuggestionType,
  })
  type: SuggestionType;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', nullable: true })
  durationMinutes?: number;

  @Column({
    type: 'enum',
    enum: SuggestionStatus,
    default: SuggestionStatus.PENDING,
  })
  status: SuggestionStatus;

  @Column({ type: 'json', nullable: true })
  triggeredBy?: Record<string, any>; // What triggered this suggestion

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
