import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Donation } from './donation.entity';
import { Nonprofit } from '../../nonprofits/entities/nonprofit.entity';

@Entity('fundraisers')
export class Fundraiser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  goalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column('timestamp with time zone')
  endDate: Date;

  @Column({ nullable: true })
  coverImageUrl: string;

  @ManyToOne(() => User, (user) => user.fundraisers)
  organizer: User;

  @ManyToOne(() => Nonprofit, (nonprofit) => nonprofit.fundraisers)
  nonprofit: Nonprofit;

  @OneToMany(() => Donation, (donation) => donation.fundraiser)
  donations: Donation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}