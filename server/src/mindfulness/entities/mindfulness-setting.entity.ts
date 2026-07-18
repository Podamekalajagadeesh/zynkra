import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FilterIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CUSTOM = 'custom',
}

@Entity('mindfulness_settings')
export class MindfulnessSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({
    type: 'enum',
    enum: FilterIntensity,
    default: FilterIntensity.MEDIUM,
  })
  filterIntensity: FilterIntensity;

  @Column({ type: 'integer', default: 60 }) // in minutes
  dailyTimeLimit: number;

  @Column({ type: 'integer', default: 30 }) // in minutes
  maxSessionDuration: number;

  @Column({ type: 'boolean', default: true })
  stressDetectionEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  breakRemindersEnabled: boolean;

  @Column({ type: 'integer', default: 15 }) // in minutes
  breakReminderInterval: number;

  @Column({ type: 'json', nullable: true })
  contentRestrictions?: string[]; // e.g., 'violence', 'negative_news', etc.

  @Column({ type: 'boolean', default: false })
  doNotDisturbEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
