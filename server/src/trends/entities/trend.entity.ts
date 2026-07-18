import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('trends')
export class Trend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tag: string;

  @Column('float', { default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  occurrenceCount: number;

  @Column({ nullable: true })
  location: string; // For location-based trending

  @CreateDateColumn({ name: 'first_seen' })
  firstSeen: Date;

  @Column({ name: 'last_updated' })
  lastUpdated: Date;

  // Users who follow this trend/hashtag
  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_followed_trends',
    joinColumn: { name: 'trend_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  followedBy: User[];
}