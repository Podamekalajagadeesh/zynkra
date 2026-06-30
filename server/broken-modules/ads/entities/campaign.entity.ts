import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { AdAccount } from './ad-account.entity';
import { AdSet } from './ad-set.entity';

export enum CampaignObjective {
  BRAND_AWARENESS = 'BRAND_AWARENESS',
  WEBSITE_TRAFFIC = 'WEBSITE_TRAFFIC',
  CONVERSIONS = 'CONVERSIONS',
  MESSAGES = 'MESSAGES',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdAccount, (adAccount) => adAccount.campaigns, { onDelete: 'CASCADE' })
  adAccount: AdAccount;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CampaignObjective,
  })
  objective: CampaignObjective;

  @Column('decimal', { nullable: true })
  budget: number;

  @Column({ nullable: true })
  budget_type: 'daily' | 'lifetime';

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AdSet, (adSet) => adSet.campaign)
  adSets: AdSet[];
}