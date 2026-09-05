import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReturnRequestType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export enum ReturnRequestStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
}

@Entity('commerce_return_requests')
@Index('IDX_commerce_return_requests_orderId', ['orderId'])
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  customerId: string;

  @Column('uuid')
  sellerId: string;

  @Column({ type: 'enum', enum: ReturnRequestType })
  type: ReturnRequestType;

  @Column({ type: 'enum', enum: ReturnRequestStatus, default: ReturnRequestStatus.REQUESTED })
  status: ReturnRequestStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: Array<Record<string, unknown>>;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}