import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('commerce_shipments')
@Index('IDX_commerce_shipments_trackingNumber', ['trackingNumber'], { unique: true })
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  sellerId: string;

  @Column()
  carrier: string;

  @Column()
  serviceLevel: string;

  @Column()
  trackingNumber: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ type: 'jsonb', nullable: true })
  label?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  pickupScheduledAt?: Date;

  @Column({ type: 'text', nullable: true })
  pickupLocation?: string;

  @Column({ type: 'timestamptz', nullable: true })
  estimatedDeliveryAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  pickedUpAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  events: Array<Record<string, unknown>>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}