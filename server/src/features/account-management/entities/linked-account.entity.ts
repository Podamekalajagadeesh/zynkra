import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum LinkedAccountProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  GITHUB = 'github',
  APPLE = 'apple',
  DISCORD = 'discord',
}

@Entity('linked_accounts')
@Index(['userId', 'provider'])
@Index(['provider', 'externalUserId'])
export class LinkedAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: LinkedAccountProvider,
  })
  provider: LinkedAccountProvider;

  @Column({ type: 'varchar' })
  externalUserId: string;

  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  connectedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
