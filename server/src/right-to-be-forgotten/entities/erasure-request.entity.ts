import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ErasureStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ErasureDataType {
  THOUGHTS = 'thoughts',
  MEMORIES = 'memories',
  NEURAL_DATA = 'neural_data',
  PERSONAL_DATA = 'personal_data',
  ALL = 'all',
}

@Entity('erasure_requests')
export class ErasureRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'simple-array', nullable: true })
  dataTypes?: ErasureDataType[];

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: ErasureStatus,
    default: ErasureStatus.PENDING,
  })
  status: ErasureStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'json', nullable: true })
  erasedItems?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
