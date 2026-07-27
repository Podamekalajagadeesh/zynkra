import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

@Entity('escrow_transactions')
export class EscrowTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.HELD })
  status: EscrowStatus;

  /** Auto-release after N days if buyer doesn't confirm */
  @Column({ type: 'int', default: 7 })
  releaseDays: number;

  /** When payment was confirmed and held */
  @Column({ type: 'timestamptz', nullable: true })
  heldAt: Date;

  /** When funds were released to seller */
  @Column({ type: 'timestamptz', nullable: true })
  releasedAt: Date;

  /** Reason for refund/dispute */
  @Column({ type: 'text', nullable: true })
  reason: string;

  /** Shipping tracking number for physical products */
  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ default: false })
  buyerConfirmedDelivery: boolean;

  @Column({ default: false })
  sellerShipped: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
