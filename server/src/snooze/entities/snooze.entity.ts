import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SnoozedType {
  USER = 'user',
  GROUP = 'group',
  PAGE = 'page',
}

@Entity('snoozes')
export class Snooze {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.snoozes)
  user: User;

  @Column()
  snoozedId: string;

  @Column({
    type: 'enum',
    enum: SnoozedType,
  })
  snoozedType: SnoozedType;

  @Column()
  snoozeEndDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}