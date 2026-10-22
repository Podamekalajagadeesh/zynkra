import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('commerce_inventory_stock')
@Index('IDX_commerce_inventory_stock_warehouse_variant', ['warehouseId', 'productVariantId'], {
  unique: true,
})
export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  warehouseId: string;

  @Column('uuid')
  productVariantId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'int', default: 0 })
  reorderPoint: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
