import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Rsvp } from './rsvp.entity';

export enum EventType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({
    type: 'varchar',
    enum: EventType,
    default: EventType.IN_PERSON,
  })
  type: EventType;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  virtualMeetingLink?: string;

  @Column({ nullable: true })
  capacity?: number;

  @Column({ default: false })
  isTicketed: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  ticketPrice?: number;

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => User)
  @JoinTable()
  hosts: User[];

  @OneToMany(() => Rsvp, (rsvp) => rsvp.event)
  rsvps: Rsvp[];
}