import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProductVariant } from './product-variant.entity';
import { OrderItem } from './order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  currency: string = 'USD';

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  categories: string[];

  @Column({ default: 'physical' })
  productType: 'physical' | 'digital' | 'print-on-demand' | 'nft';

  @Column({ nullable: true })
  fileUrl?: string; // For digital products (e-books, courses)

  @Column({ type: 'jsonb', nullable: true })
  nftMetadata?: {
    contractAddress: string;
    tokenId: string;
    blockchain: string; // 'ethereum', 'polygon', etc.
    metadataUri: string; // IPFS or Arweave URI
    isLimitedEdition: boolean;
    editionNumber?: number;
    totalEditions?: number;
    attributes: {
      trait_type: string;
      value: string;
    }[];
  };

  @Column({ type: 'jsonb', nullable: true })
  printOnDemandSettings?: {
    provider: string;
    baseCost: number;
    shippingLocations: string[];
    variants: {
      size?: string;
      color?: string;
      material?: string;
      price: number;
    }[];
  };

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @Column({ default: 'physical' })
  productType: 'physical' | 'digital' | 'print-on-demand';

  @Column({ nullable: true })
  fileUrl?: string; // For digital products (e-books, courses)

  @Column({ type: 'jsonb', nullable: true })
  printOnDemandSettings?: {
    provider: string;
    baseCost: number;
    shippingLocations: string[];
    variants: {
      size?: string;
      color?: string;
      material?: string;
      price: number;
    }[];
  };

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.productVariant.product)
  orderItems: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}