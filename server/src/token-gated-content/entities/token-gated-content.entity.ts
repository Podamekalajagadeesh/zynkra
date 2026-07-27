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

  @Column({ default: 1 })
  chainId: number;

  @Column({ default: 'basic' })
  tier: string;

  @ManyToOne(() => User, (user) => user.tokenGatedContent)
  creator: User;
}