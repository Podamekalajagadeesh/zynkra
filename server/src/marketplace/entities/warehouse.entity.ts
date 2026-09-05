import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Entity, Index } from 'typeorm';

@Entity('commerce_warehouses')
@Index('IDX_commerce_warehouses_sellerId', ['sellerId'])
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sellerId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  address: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}