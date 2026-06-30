import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Campaign } from './campaign.entity';
import { Ad } from './ad.entity';

@Entity('ad_sets')
export class AdSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.adSets, { onDelete: 'CASCADE' })
  campaign: Campaign;

  @Column()
  name: string;

  @Column('jsonb', { nullable: true })
  targeting: {
    age?: { min: number; max: number };
    gender?: 'male' | 'female' | 'all';
    locations?: string[];
    interests?: string[];
  };

  @Column('decimal')
  dailyBudget: number;

  @Column({ nullable: true })
  bid_strategy: 'lowest_cost' | 'cost_cap' | 'bid_cap';

  @Column('decimal', { nullable: true })
  bid_amount: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @OneToMany(() => Ad, (ad) => ad.adSet)
  ads: Ad[];
}