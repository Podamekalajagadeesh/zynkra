
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @ManyToOne(() => User)
  rater: User;

  @ManyToOne(() => User)
  ratee: User;

  @OneToOne(() => Transaction)
  @JoinColumn()
  transaction: Transaction;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}