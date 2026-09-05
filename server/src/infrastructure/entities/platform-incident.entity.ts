import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type PlatformIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type PlatformIncidentImpact = 'minor' | 'major' | 'critical';

@Entity('platform_incidents')
@Index('IDX_platform_incidents_status_createdAt', ['status', 'createdAt'])
export class PlatformIncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 32 })
  service: string;

  @Column({ type: 'varchar', length: 16 })
  impact: PlatformIncidentImpact;

  @Column({ type: 'varchar', length: 16 })
  status: PlatformIncidentStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
