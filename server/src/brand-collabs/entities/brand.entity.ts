import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CollabOpportunity } from './collab-opportunity.entity';

@Entity()
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column()
  industry: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minBudget: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxBudget: number;

  @ManyToOne(() => User, user => user.brands)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => CollabOpportunity, opportunity => opportunity.brand)
  opportunities: CollabOpportunity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}