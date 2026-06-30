import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';
import { Campaign } from './campaign.entity';
import { InstantForm } from './instant-form.entity';

@Entity('ad_accounts')
export class AdAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  businessName: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  currency: string;

  @OneToMany(() => Campaign, (campaign) => campaign.adAccount)
  campaigns: Campaign[];

  @OneToMany(() => InstantForm, (form) => form.adAccount)
  instantForms: InstantForm[];
}