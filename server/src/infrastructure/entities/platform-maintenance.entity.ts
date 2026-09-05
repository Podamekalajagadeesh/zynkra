import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type PlatformMaintenanceStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

@Entity('platform_maintenance_windows')
@Index('IDX_platform_maintenance_windows_status_startsAt', ['status', 'startsAt'])
export class PlatformMaintenanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 32 })
  service: string;

  @Column({ type: 'timestamp with time zone' })
  startsAt: Date;

  @Column({ type: 'timestamp with time zone' })
  endsAt: Date;

  @Column({ type: 'varchar', length: 16 })
  status: PlatformMaintenanceStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
