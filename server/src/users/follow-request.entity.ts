import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './entities/user.entity';

@Entity()
export class FollowRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentFollowRequests)
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFollowRequests)
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;
}