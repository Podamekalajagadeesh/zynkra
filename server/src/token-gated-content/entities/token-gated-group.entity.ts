import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class TokenGatedGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  tokenAddress: string;

  @Column()
  minTokenBalance: number;

  @ManyToOne(() => User, (user) => user.createdTokenGatedGroups)
  creator: User;

  @ManyToMany(() => User, (user) => user.joinedTokenGatedGroups)
  @JoinTable()
  members: User[];
}