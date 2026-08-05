import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('webhook_endpoints')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  developer: User;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  // SHA-256 of the signing secret. The plaintext secret is returned exactly
  // once at creation so the subscriber can verify signatures.
  @Column({ type: 'varchar' })
  secretHash: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  events: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
