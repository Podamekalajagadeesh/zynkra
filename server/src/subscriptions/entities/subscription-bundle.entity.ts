import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionTier } from './subscription-tier.entity';

@Entity('subscription_bundles')
export class SubscriptionBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => SubscriptionBundleTier, (b) => b.bundle, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  tiers: SubscriptionBundleTier[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

@Entity('subscription_bundle_tiers')
export class SubscriptionBundleTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SubscriptionBundle, (bundle) => bundle.tiers, {
    onDelete: 'CASCADE',
  })
  bundle: SubscriptionBundle;

  @ManyToOne(() => SubscriptionTier, { onDelete: 'CASCADE' })
  tier: SubscriptionTier;
}
