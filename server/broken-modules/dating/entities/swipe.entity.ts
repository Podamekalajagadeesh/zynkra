import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity('swipes')
export class Swipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  swiper: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  swiped: User;

  @Column()
  type: 'like' | 'dislike';

  @CreateDateColumn()
  createdAt: Date;
}