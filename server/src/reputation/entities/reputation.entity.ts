import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReputationLog } from './reputation-log.entity';

@Entity()
export class Reputation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.reputation)
  user: User;

  @Column({ default: 0 })
  score: number;

  @OneToMany(() => ReputationLog, (log) => log.reputation)
  logs: ReputationLog[];
}