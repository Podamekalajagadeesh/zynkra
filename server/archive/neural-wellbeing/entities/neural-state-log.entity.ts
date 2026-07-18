import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EmotionalState {
  CALM = 'calm',
  STRESSED = 'stressed',
  ANXIOUS = 'anxious',
  BURNOUT = 'burnout',
  ENERGETIC = 'energetic',
  NEUTRAL = 'neutral',
}

@Entity('neural_state_logs')
export class NeuralStateLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float' })
  stressLevel: number; // 0-1, 1 is highest stress

  @Column({ type: 'float' })
  anxietyLevel: number; // 0-1

  @Column({ type: 'float' })
  engagementLevel: number; // 0-1

  @Column({
    type: 'enum',
    enum: EmotionalState,
  })
  emotionalState: EmotionalState;

  @Column({ type: 'json', nullable: true })
  rawNeuralData?: Record<string, any>; // Optional raw neural sensor data

  @CreateDateColumn()
  createdAt: Date;
}
