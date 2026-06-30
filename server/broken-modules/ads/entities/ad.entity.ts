import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { AdSet } from './ad-set.entity';
import { AdCreative } from './ad-creative.entity';
import { Lead } from './lead.entity';

@Entity('ads')
export class Ad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdSet, (adSet) => adSet.ads, { onDelete: 'CASCADE' })
  adSet: AdSet;

  @ManyToOne(() => AdCreative, (creative) => creative.ads, { onDelete: 'CASCADE' })
  creative: AdCreative;

  @OneToMany(() => Lead, (lead) => lead.ad)
  leads: Lead[];
}