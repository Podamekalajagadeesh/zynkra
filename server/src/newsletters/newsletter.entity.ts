import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum NewsletterStatus { DRAFT = 'draft', SCHEDULED = 'scheduled', SENT = 'sent' }

@Entity('newsletters')
export class Newsletter {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) slug: string;
  @Column({ type: 'varchar', length: 500 }) title: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'text', nullable: true }) excerpt: string;
  @Column({ nullable: true }) coverImage: string;
  @Column({ nullable: true }) authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' }) author: User;
  @Column({ type: 'enum', enum: NewsletterStatus, default: NewsletterStatus.DRAFT }) status: NewsletterStatus;
  @Column({ type: 'timestamptz', nullable: true }) scheduledAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @Column({ type: 'int', default: 0 }) subscriberCount: number;
  @Column({ type: 'int', default: 0 }) openCount: number;
  @Column({ type: 'int', default: 0 }) clickCount: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column({ default: true }) isActive: boolean;
  @Column({ nullable: true }) userId: string;
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' }) user: User;
  @CreateDateColumn() subscribedAt: Date;
}

@Entity('newsletter_newslettersubscribers')
export class NewsletterSubscription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' }) author: User;
  @Column() subscriberId: string;
  @ManyToOne(() => NewsletterSubscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' }) subscriber: NewsletterSubscriber;
  @CreateDateColumn() subscribedAt: Date;
}
