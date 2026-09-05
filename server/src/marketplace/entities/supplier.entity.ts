import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('commerce_suppliers')
@Index('IDX_commerce_suppliers_sellerId', ['sellerId'])
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sellerId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ type: 'jsonb', nullable: true })
  address?: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}