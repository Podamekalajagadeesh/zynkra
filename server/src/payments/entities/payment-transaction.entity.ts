import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'internal' })
  provider: string;

  @Column({ type: 'varchar', length: 50, default: 'succeeded' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  paymentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  purpose: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  payer: User | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  recipient: User | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
