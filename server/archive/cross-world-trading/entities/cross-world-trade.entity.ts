import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TradeStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('cross_world_trades')
export class CrossWorldTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sellerId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ nullable: true })
  buyerId?: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'buyerId' })
  buyer?: User;

  @Column('json')
  offeredAssets: string[];

  @Column('json')
  requestedAssets: string[];

  @Column('float')
  price: number;

  @Column({ default: 'GLOBAL_COIN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.PENDING,
  })
  status: TradeStatus;

  @CreateDateColumn()
  createdAt: Date;
}
