import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/** Created when two users like each other (mutual swipe or mutual crush). */
@Entity('dating_matches')
export class DatingMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({ name: 'dating_match_users' })
  users: User[];

  @CreateDateColumn()
  createdAt: Date;
}
