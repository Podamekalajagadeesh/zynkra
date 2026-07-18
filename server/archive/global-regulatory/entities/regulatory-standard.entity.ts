import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StandardCategory {
  SAFETY = 'safety',
  PRIVACY = 'privacy',
  GOVERNANCE = 'governance',
  ETHICS = 'ethics',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  PARTIAL = 'partial',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
}

@Entity('regulatory_standards')
export class RegulatoryStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  jurisdiction: string; // e.g., "EU", "US", "Global"

  @Column({
    type: 'enum',
    enum: StandardCategory,
  })
  category: StandardCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ type: 'simple-array', nullable: true })
  applicableRegions?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
