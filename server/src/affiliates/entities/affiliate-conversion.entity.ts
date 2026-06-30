import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { Transaction } from '../../marketplace/entities/transaction.entity';

@Entity()
export class AffiliateConversion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AffiliateLink, link => link.conversions)
  affiliateLink: AffiliateLink;

  @Column()
  affiliateLinkId: string;

  @OneToOne(() => Transaction)
  @JoinColumn()
  transaction: Transaction;

  @Column()
  transactionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionEarned: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  @CreateDateColumn()
  convertedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;
}