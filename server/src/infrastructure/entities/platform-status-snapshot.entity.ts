import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('platform_status_snapshots')
@Index('IDX_platform_status_snapshots_generatedAt', ['generatedAt'])
export class PlatformStatusSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 16 })
  status: 'operational' | 'degraded' | 'outage';

  @Column({ type: 'varchar', length: 64 })
  version: string;

  @Column({ type: 'varchar', length: 32 })
  environment: string;

  @Column({ type: 'integer' })
  responseTimeMs: number;

  @Column({ type: 'jsonb' })
  services: Record<string, { status: string; responseTimeMs?: number; detail?: string }>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  generatedAt: Date;
}
