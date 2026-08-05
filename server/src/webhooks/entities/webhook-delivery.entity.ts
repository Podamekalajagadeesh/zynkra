import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WebhookEndpoint } from './webhook-endpoint.entity';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => WebhookEndpoint, { onDelete: 'CASCADE' })
  endpoint: WebhookEndpoint;

  @Column({ type: 'varchar', length: 120 })
  event: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'delivered' | 'failed';

  @Column({ type: 'int', default: 0 })
  retries: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  lastError: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deliveredAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
