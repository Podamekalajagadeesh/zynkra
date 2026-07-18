import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';

@Entity()
export class AffiliateClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AffiliateLink, link => link.clicks)
  affiliateLink: AffiliateLink;

  @Column()
  affiliateLinkId: string;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @CreateDateColumn()
  clickedAt: Date;
}