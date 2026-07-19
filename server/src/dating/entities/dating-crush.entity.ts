import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/** Secret crush: revealed (as a match) only when it's mutual. */
@Entity('dating_crushes')
@Index(['user', 'crushedUser'], { unique: true })
export class DatingCrush {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => User, { eager: true })
  crushedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
