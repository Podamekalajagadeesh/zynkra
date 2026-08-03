import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 160 })
  clientName: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  clientEmail: string | null;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  // Server-computed amounts; the client never supplies subtotal/tax/total.
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  lineItems: InvoiceLineItem[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'varchar', length: 40, unique: true })
  invoiceNo: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
