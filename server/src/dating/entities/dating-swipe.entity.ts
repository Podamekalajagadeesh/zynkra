import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type SwipeType = 'like' | 'dislike';

@Entity('dating_swipes')
@Index(['swiper', 'swiped'], { unique: true })
export class DatingSwipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  swiper: User;

  @ManyToOne(() => User, { eager: true })
  swiped: User;

  @Column({ type: 'varchar', length: 10 })
  type: SwipeType;

  @CreateDateColumn()
  createdAt: Date;
}
