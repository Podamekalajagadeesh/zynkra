import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('dating_profiles')
export class DatingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column({ type: 'text', default: '' })
  bio: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  interests: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  datingPhotos: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  /** Matching preferences (interested-in genders, age range, distance…). */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  preferences: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
