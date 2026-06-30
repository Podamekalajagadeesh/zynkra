import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Fundraiser } from './fundraiser.entity';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  message: string;

  @ManyToOne(() => User, (user) => user.donations)
  donor: User;

  @ManyToOne(() => Fundraiser, (fundraiser) => fundraiser.donations)
  fundraiser: Fundraiser;

  @Column({ nullable: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;
}