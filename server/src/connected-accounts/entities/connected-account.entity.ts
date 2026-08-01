import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ConnectedAccountPlatform {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
}

@Entity('connected_accounts')
export class ConnectedAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: ConnectedAccountPlatform })
  platform: ConnectedAccountPlatform;

  @Column({ type: 'text', default: '' })
  platformUsername: string;

  @Column({ type: 'text', default: '' })
  platformUserId: string;

  @Column({ type: 'text', nullable: true })
  apiKey: string | null;

  @Column({ type: 'text', nullable: true })
  apiSecret: string | null;

  @Column({ type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
