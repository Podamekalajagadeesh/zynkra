import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MarketplaceListing } from '../../marketplace/entities/listing.entity';

@Entity('saved_marketplace_listings')
@Unique(['user', 'listing'])
export class SavedMarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.savedMarketplaceListings)
  user: User;

  @ManyToOne(() => MarketplaceListing, (listing) => listing.savedBy)
  listing: MarketplaceListing;

  @CreateDateColumn()
  createdAt: Date;
}