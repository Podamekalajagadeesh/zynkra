import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../marketplace/entities/product.entity';

@Entity()
export class LiveShoppingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ default: false })
  isLive: boolean;

  @ManyToOne(() => User, (user) => user.id)
  host: User;

  @Column()
  hostId: string;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'live_shopping_event_products',
    joinColumn: { name: 'eventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' },
  })
  products: Product[];

  @Column({ type: 'jsonb', nullable: true })
  productSettings: {
    productId: string;
    isFlashSale?: boolean;
    flashSaleEndsAt?: Date;
    exclusiveDiscount?: number;
    isFeatured?: boolean;
  }[];

  @Column({ default: 0 })
  viewerCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}