import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Token } from './token.entity';

@Entity('balances')
export class Balance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.balances)
  user: User;

  @ManyToOne(() => Token)
  token: Token;

  @Column('decimal', { precision: 36, scale: 18, default: 0 })
  amount: number;
}