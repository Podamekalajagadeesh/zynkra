import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class TokenGatedContent {
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

  @ManyToOne(() => User, (user) => user.tokenGatedContent)
  creator: User;
}