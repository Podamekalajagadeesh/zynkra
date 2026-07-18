import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AffiliateClick } from './affiliate-click.entity';
import { AffiliateConversion } from './affiliate-conversion.entity';

@Entity()
export class AffiliateLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  destinationUrl: string;

  @Column({ unique: true })
  slug: string;

  @ManyToOne(() => User, user => user.affiliateLinks)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => AffiliateClick, click => click.affiliateLink)
  clicks: AffiliateClick[];

  @OneToMany(() => AffiliateConversion, conversion => conversion.affiliateLink)
  conversions: AffiliateConversion[];

  @Column({ default: 0 })
  clickCount: number;

  @Column({ default: 0 })
  conversionCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commissionRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}