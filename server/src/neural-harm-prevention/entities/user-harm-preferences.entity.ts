import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_harm_preferences')
export class UserHarmPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: true })
  seizureRiskBlocked: boolean;

  @Column({ type: 'boolean', default: true })
  emotionalDistressBlocked: boolean;

  @Column({ type: 'float', default: 0.7 })
  seizureRiskThreshold: number;

  @Column({ type: 'float', default: 0.6 })
  emotionalDistressThreshold: number;

  @Column({ type: 'boolean', default: true })
  warnBeforeBlocking: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
