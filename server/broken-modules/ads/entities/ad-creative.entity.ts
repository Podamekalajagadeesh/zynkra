import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Ad } from './ad.entity';
import { InstantForm } from './instant-form.entity';

@Entity('ad_creatives')
export class AdCreative {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  body: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column()
  callToAction: string;

  @Column({ nullable: true })
  destinationUrl: string;

  @ManyToOne(() => InstantForm, (form) => form.adCreatives, { nullable: true, onDelete: 'SET NULL' })
  instantForm: InstantForm;

  @OneToMany(() => Ad, (ad) => ad.creative)
  ads: Ad[];
}