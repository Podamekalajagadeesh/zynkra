import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PurchaseStatus {
  PENDING = 'pending',
  FUNDING = 'funding',
  FUNDED = 'funded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('collective_purchases')
export class CollectivePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ type: 'float' })
  totalPrice: number;

  @Column({ type: 'float', default: 0 })
  currentAmount: number;

  @Column({ default: 2 })
  minParticipants: number;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.FUNDING,
  })
  status: PurchaseStatus;

  @OneToMany(() => CollectivePurchaseParticipant, (participant) => participant.collectivePurchase)
  participants: CollectivePurchaseParticipant[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('collective_purchase_participants')
export class CollectivePurchaseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  purchaseId: string;

  @ManyToOne(() => CollectivePurchase, (purchase) => purchase.participants)
  @JoinColumn({ name: 'purchaseId' })
  collectivePurchase: CollectivePurchase;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float' })
  contributionAmount: number;

  @CreateDateColumn()
  joinedAt: Date;
}
