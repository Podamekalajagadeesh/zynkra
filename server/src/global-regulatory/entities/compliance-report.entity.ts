import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RegulatoryStandard } from './regulatory-standard.entity';
import { ComplianceStatus } from './regulatory-standard.entity';

@Entity('compliance_reports')
export class ComplianceReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  standardId?: string;

  @ManyToOne(() => RegulatoryStandard)
  @JoinColumn({ name: 'standardId' })
  standard?: RegulatoryStandard;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
  })
  status: ComplianceStatus;

  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ type: 'timestamp', nullable: true })
  auditDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextAuditDate?: Date;

  @Column({ type: 'json', nullable: true })
  metrics?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
