import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum InventoryReservationStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

@Entity('commerce_inventory_reservations')
@Index('IDX_commerce_inventory_reservations_status_expires', ['status', 'expiresAt'])
export class InventoryReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  warehouseId: string;

  @Column('uuid')
  productVariantId: string;

  @Column('uuid', { nullable: true })
  orderId?: string;

  @Column('uuid')
  customerId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'enum', enum: InventoryReservationStatus, default: InventoryReservationStatus.ACTIVE })
  status: InventoryReservationStatus;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}