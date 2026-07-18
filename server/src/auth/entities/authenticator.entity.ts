import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('authenticators')
export class Authenticator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  credentialID: string;

  @Column()
  credentialPublicKey: string;

  @Column()
  counter: number;

  @Column()
  transports: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  user: User;
}