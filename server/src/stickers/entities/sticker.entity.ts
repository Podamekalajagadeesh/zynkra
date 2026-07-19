import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSticker } from './user-sticker.entity';

@Entity()
export class Sticker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  animated: boolean;

  // Raw SQL default: TypeORM mis-compares decimal literal defaults against
  // Postgres and flags phantom drift on every migration:generate.
  @Column('decimal', { precision: 10, scale: 2, default: () => '0.99' })
  price: number;

  @Column({ default: 0 })
  totalSales: number;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, user => user.stickers)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => UserSticker, userSticker => userSticker.sticker)
  userStickers: UserSticker[];

  @Column()
  category: string; // 'anime, gaming, lifestyle, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}