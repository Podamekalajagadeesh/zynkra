import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity('ad_preferences')
export class AdPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @OneToOne(() => User, (user) => user.adPreference)
  // @JoinColumn()
  // user: User;

  @Column()
  userId: string;

  @Column('simple-array', { default: [] })
  interestTopics: string[];

  @Column({ default: true })
  showTargetedAds: boolean;
}