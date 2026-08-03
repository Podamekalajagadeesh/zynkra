import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('oauth_apps')
export class OAuthApp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  developer: User;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', unique: true })
  clientId: string;

  // SHA-256 of the client secret. Never stored or returned in plaintext.
  @Column({ type: 'varchar' })
  clientSecretHash: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  redirectUris: string[];

  @Column({ type: 'jsonb', default: () => "'[\"read_profile\"]'" })
  scopes: string[];

  @Column({ type: 'varchar', length: 254, nullable: true })
  homepageUrl: string | null;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
