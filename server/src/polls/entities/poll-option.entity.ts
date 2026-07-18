import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Poll } from './poll.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class PollOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @ManyToOne(() => Poll, (poll) => poll.options)
  poll: Poll;

  @OneToMany(() => User, (user) => user.votedOptions)
  votes: User[];

  @Column({ default: 0 })
  voteCount: number;
}