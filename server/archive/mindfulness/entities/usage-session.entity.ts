import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SessionType {
  NEURAL_CONTENT = 'neural_content',
  REGULAR_CONTENT = 'regular_content',
  STREAMING = 'streaming',
}

@Entity('usage_sessions')
export class UsageSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SessionType,
  })
  sessionType: SessionType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'integer', nullable: true })
  durationSeconds?: number;

  @Column({ type: 'float', nullable: true })
  stressLevel?: number; // 0-1

  @Column({ type: 'json', nullable: true })
  contentTypes?: string[];

  @Column({ type: 'boolean', default: false })
  limitReached: boolean;

  @Column({ type: 'boolean', default: false })
  breakReminded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
