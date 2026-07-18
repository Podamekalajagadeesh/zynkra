import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum MobilePushPlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

export enum MobilePushProvider {
  FCM = 'fcm',
  APNS = 'apns',
}

@Entity('mobile_push_tokens')
export class MobilePushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'varchar', default: MobilePushPlatform.ANDROID })
  platform: MobilePushPlatform;

  @Column({ type: 'varchar', default: MobilePushProvider.FCM })
  provider: MobilePushProvider;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
