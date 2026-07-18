import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReputationLog } from './reputation-log.entity';

@Entity()
export class Reputation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.reputation)
  user: User;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  score: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  earnedCryptocurrency: number; // Total cryptocurrency earned by user

  @OneToMany(() => ReputationLog, (log) => log.reputation)
  logs: ReputationLog[];
}