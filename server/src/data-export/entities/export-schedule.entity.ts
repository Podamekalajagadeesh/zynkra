import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Per-user automatic export schedule (the "data pocket" cadence).
 *
 * A user opts in once; an hourly cron then produces a fresh archive every
 * `intervalDays`, so a portable copy of the account always exists without
 * anyone remembering to click the button. Disabled schedules keep their
 * history (`lastExportAt`) but carry no `nextExportAt`.
 */
@Entity()
export class ExportSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Explicit non-null FK column: TypeORM would otherwise give the OneToOne
   * join column a nullable default, which drifts from the migration (a
   * schedule row without an owner is meaningless).
   */
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  enabled: boolean;

  @Column({ type: 'int', default: 30 })
  intervalDays: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExportAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextExportAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
