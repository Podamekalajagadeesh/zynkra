import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TaxDocumentStatus {
  AVAILABLE = 'available',
}

@Entity('tax_documents')
@Unique('UQ_tax_document_user_year_form', ['user', 'taxYear', 'formType'])
export class TaxDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int' })
  taxYear: number;

  @Column({ type: 'varchar', length: 20, default: '1099-NEC' })
  formType: string;

  @Column({
    type: 'enum',
    enum: TaxDocumentStatus,
    default: TaxDocumentStatus.AVAILABLE,
  })
  status: TaxDocumentStatus;

  // Gross reportable income for the year (server-computed from the wallet ledger).
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
