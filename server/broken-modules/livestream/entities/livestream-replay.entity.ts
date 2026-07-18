import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity()
export class LiveStreamReplay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  videoUrl: string;

  @Column()
  title: string;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;
}