
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './question.entity';
import { Submission } from './submission.entity';

@Entity()
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  ownerId!: string; // Assuming owner is a user ID for now

  @OneToMany(() => Question, (question) => question.form, { cascade: true })
  questions!: Question[];

  @OneToMany(() => Submission, (submission) => submission.form)
  submissions!: Submission[];
}