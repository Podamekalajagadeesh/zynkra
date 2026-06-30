import { User } from '../../users/entities/user.entity';
import { SavedMarketplaceListing } from '../../saved-marketplace-listings/entities/saved-marketplace-listing.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('marketplace_listings')
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal')
  price: number;

  @Column()
  location: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @ManyToOne(() => User, (user) => user.listings)
  seller: User;

  @OneToMany(() => SavedMarketplaceListing, (savedListing) => savedListing.listing)
  savedBy: SavedMarketplaceListing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}