import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { InstantForm } from './instant-form.entity';
import { Ad } from './ad.entity';
import { User } from '../../../src/users/entities/user.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InstantForm, (form) => form.leads, { onDelete: 'CASCADE' })
  instantForm: InstantForm;

  @ManyToOne(() => Ad, (ad) => ad.leads, { onDelete: 'CASCADE' })
  ad: Ad;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('jsonb')
  data: Record<string, any>;

  @CreateDateColumn()
  submittedAt: Date;
}