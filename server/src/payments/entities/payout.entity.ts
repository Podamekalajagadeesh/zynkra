import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  creator: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 50, default: 'succeeded' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  purpose: string | null;

  @Column({ type: 'varchar', nullable: true })
  payoutId: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
