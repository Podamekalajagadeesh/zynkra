import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('commerce_demand_forecasts')
@Index('IDX_commerce_demand_forecasts_variant_period', ['productVariantId', 'periodStart'])
export class DemandForecast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sellerId: string;

  @Column('uuid')
  productVariantId: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'int' })
  forecastQuantity: number;

  @Column({ type: 'int' })
  basedOnDays: number;

  @CreateDateColumn()
  createdAt: Date;
}