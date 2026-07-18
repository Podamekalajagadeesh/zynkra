import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity()
export class CrisisEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  region: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column()
  severity: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}