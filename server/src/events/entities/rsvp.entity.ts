import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { RsvpStatus } from './rsvp-status.enum';

@Entity()
export class Rsvp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.rsvps, { onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'varchar',
    enum: RsvpStatus,
    default: RsvpStatus.GOING,
  })
  status: RsvpStatus;

  @Column({ nullable: true })
  plusOne?: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  amountPaid?: number;

  @Column({ nullable: true })
  paymentId?: string;

  @Column({ default: false })
  reminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}