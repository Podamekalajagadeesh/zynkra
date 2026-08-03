import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OAuthApp } from './oauth-app.entity';

@Entity('oauth_authorizations')
export class OAuthAuthorization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => OAuthApp, { onDelete: 'CASCADE' })
  app: OAuthApp;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  scopes: string[];

  // One-time authorization code (SHA-256 hashed at rest).
  @Index()
  @Column({ type: 'varchar', nullable: true })
  codeHash: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  codeExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  codeChallenge: string | null;

  @Column({ type: 'varchar', length: 10, default: 'S256' })
  codeChallengeMethod: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
