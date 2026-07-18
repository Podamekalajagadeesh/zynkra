import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('data_minimization_policies')
export class DataMinimizationPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  policyName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  allowedDataTypes: string[];

  @Column({ type: 'simple-array', nullable: true })
  requiredDataTypes: string[];

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'integer', default: 90 })
  retentionDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
