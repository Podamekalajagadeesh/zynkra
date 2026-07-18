import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VirtualProperty } from './virtual-property.entity';

@Entity('property_listings')
export class PropertyListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VirtualProperty, property => property.listings)
  @JoinColumn({ name: 'propertyId' })
  property: VirtualProperty;

  @Column()
  propertyId: string;

  @Column('float')
  sharesAvailable: number;

  @Column('float')
  sharePrice: number;

  @Column('float')
  minInvestment: number;

  @Column('float')
  totalShares: number;

  @Column('float', { default: 0 })
  currentSharesSold: number;

  @Column('float')
  projectedAnnualReturn: number;

  @Column('text')
  description: string;

  @Column()
  endDate: Date;

  @Column({ default: 'active' })
  status: string; // active, completed, cancelled

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
