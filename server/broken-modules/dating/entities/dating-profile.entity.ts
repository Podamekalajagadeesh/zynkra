import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity('dating_profiles')
export class DatingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column('text')
  bio: string;

  @Column('simple-array')
  interests: string[];

  @Column('simple-array')
  datingPhotos: string[];

  @Column()
  gender: string;

  @Column()
  age: number;

  @Column()
  location: string;

  @Column('jsonb', { default: {} })
  preferences: {
    ageRange?: [number, number];
    gender?: string;
    distance?: number;
  };
}