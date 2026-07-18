import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Ad } from './ad.entity';
import { User } from '../../../src/users/entities/user.entity';

@Entity('ad_impressions')
export class AdImpression {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ad)
  ad: Ad;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  timestamp: Date;
}