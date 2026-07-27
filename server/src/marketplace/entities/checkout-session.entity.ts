import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

export enum CheckoutStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  /** Payment method used */
  @Column({ type: 'varchar', default: 'card' })
  paymentMethod: 'card' | 'crypto' | 'wallet';

  @Column({ type: 'enum', enum: CheckoutStatus, default: CheckoutStatus.PENDING })
  status: CheckoutStatus;

  /** Stripe payment intent ID */
  @Column({ nullable: true })
  paymentIntentId: string;

  /** Crypto transaction hash */
  @Column({ nullable: true })
  txHash: string;

  /** Shipping details for physical products */
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;

  /** Order confirmation number */
  @Column({ nullable: true })
  orderNumber: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
