import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PropertyShare } from './property-share.entity';
import { PropertyListing } from './property-listing.entity';

@Entity('virtual_properties')
export class VirtualProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  worldId: string;

  @Column()
  worldName: string;

  @Column({ unique: true })
  parcelId: string;

  @Column('jsonb')
  coordinates: { x: number; y: number };

  @Column('float')
  size: number;

  @Column('float')
  totalValue: number;

  @Column('float')
  currentValue: number;

  @Column('float', { default: 0 })
  revenueShare: number;

  @Column('float', { default: 0 })
  monthlyRevenue: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isDeveloped: boolean;

  @Column({ nullable: true })
  developmentType: string;

  @Column()
  blockchainNetwork: string;

  @Column({ nullable: true })
  tokenContractAddress: string;

  @OneToMany(() => PropertyShare, share => share.property, { cascade: true })
  shares: PropertyShare[];

  @OneToMany(() => PropertyListing, listing => listing.property, { cascade: true })
  listings: PropertyListing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
