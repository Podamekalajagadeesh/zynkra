import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable()
  users: User[];

  @CreateDateColumn()
  createdAt: Date;
}