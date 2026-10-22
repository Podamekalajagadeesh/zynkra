import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

export enum DataExportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETION_PENDING = 'deletion_pending',
  DELETION_COMPLETED = 'deletion_completed',
  DELETION_FAILED = 'deletion_failed',
}

@Entity()
export class DataExport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: DataExportStatus,
    default: DataExportStatus.PENDING,
  })
  status: DataExportStatus;

  /** What produced this export: 'manual' (user clicked) or 'scheduled' (cron). */
  @Column({ type: 'varchar', length: 16, default: 'manual' })
  origin: string;

  @Column({ nullable: true })
  fileUrl: string;

  /** Archive size in bytes once completed (null while pending/failed/expired). */
  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number | null;

  @Column({ nullable: true, type: 'timestamp' })
  scheduledDeletionAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
