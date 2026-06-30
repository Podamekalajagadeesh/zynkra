import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('life_events')
export class LifeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.lifeEvents, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  description?: string;
}