import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity()
export class ScheduledStream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp with time zone' })
  scheduledTime: Date;

  @Column()
  userId: string;

  @Column({ default: false })
  isLive: boolean;
}