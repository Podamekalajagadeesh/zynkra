import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SandboxEnvironmentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

@Entity('sandbox_environments')
@Index('UQ_sandbox_environments_slug', ['slug'], { unique: true })
@Index('UQ_sandbox_environments_accessKeyHash', ['accessKeyHash'], { unique: true })
@Index('IDX_sandbox_environments_status', ['status'])
@Index('IDX_sandbox_environments_expiresAt', ['expiresAt'])
export class SandboxEnvironmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'varchar', length: 96, select: false })
  accessKeyHash: string;

  @Column({ type: 'enum', enum: SandboxEnvironmentStatus, default: SandboxEnvironmentStatus.ACTIVE })
  status: SandboxEnvironmentStatus;

  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}