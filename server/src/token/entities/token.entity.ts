import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  symbol: string;

  @Column('decimal', { precision: 36, scale: 18 })
  totalSupply: number;

  @OneToOne(() => User)
  @JoinColumn()
  owner: User;
}