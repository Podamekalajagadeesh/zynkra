import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum CourseStatus { DRAFT = 'draft', PUBLISHED = 'published', ARCHIVED = 'archived' }

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) slug: string;
  @Column({ type: 'varchar', length: 500 }) title: string;
  @Column({ type: 'text' }) description: string;
  @Column({ nullable: true }) coverImage: string;
  @Column({ type: 'text', nullable: true }) curriculum: string;
  @Column({ nullable: true }) authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' }) author: User;
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT }) status: CourseStatus;
  @Column({ type: 'int', default: 0 }) enrollmentCount: number;
  @Column({ type: 'int', default: 0 }) lessonCount: number;
  @Column({ default: false }) isGated: boolean;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) price: number | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('course_lessons')
export class CourseLesson {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() courseId: string;
  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' }) course: Course;
  @Column({ type: 'varchar', length: 500 }) title: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'int' }) orderIndex: number;
  @Column({ type: 'int', default: 0 }) durationMinutes: number;
  @Column({ nullable: true }) videoUrl: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('course_enrollments')
export class CourseEnrollment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() courseId: string;
  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' }) course: Course;
  @Column() userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'int', default: 0 }) progress: number;
  @Column({ type: 'simple-array', nullable: true }) completedLessons: string[];
  @Column({ default: false }) isCompleted: boolean;
  @CreateDateColumn() createdAt: Date;
}
