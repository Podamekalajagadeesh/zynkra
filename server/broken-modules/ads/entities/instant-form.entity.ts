import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { AdAccount } from './ad-account.entity';
import { Lead } from './lead.entity';
import { AdCreative } from './ad-creative.entity';

export interface InstantFormField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'dropdown';
  label: string;
  options?: string[];
}

@Entity('instant_forms')
export class InstantForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdAccount, (account) => account.instantForms, { onDelete: 'CASCADE' })
  adAccount: AdAccount;

  @Column()
  name: string;

  @Column('jsonb')
  fields: InstantFormField[];

  @Column()
  callToAction: string;

  @OneToMany(() => Lead, (lead) => lead.instantForm)
  leads: Lead[];

  @OneToMany(() => AdCreative, (creative) => creative.instantForm)
  adCreatives: AdCreative[];
}