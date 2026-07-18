import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('neural_product_reviews')
export class NeuralProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'json', default: () => "'[]'" })
  sensoryData: Array<{
    type: 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory';
    data: any;
  }>;

  @Column({ type: 'float', default: 0 })
  overallRating: number;

  @Column({ type: 'json', default: () => "'{}'" })
  categoryRatings: Record<string, number>;

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
