import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EthicsBoard } from './ethics-board.entity';

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('ethics_audits')
export class EthicsAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  boardId?: string;

  @ManyToOne(() => EthicsBoard, { nullable: true })
  @JoinColumn({ name: 'boardId' })
  board?: EthicsBoard;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SCHEDULED,
  })
  status: AuditStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate?: Date;

  @Column({ type: 'json', nullable: true })
  findings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  recommendations?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
