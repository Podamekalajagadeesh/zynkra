
import { User } from '../../../src/users/entities/user.entity';
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

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true, type: 'timestamp' })
  scheduledDeletionAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}