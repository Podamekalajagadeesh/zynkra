
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Form } from './form.entity';

export enum QuestionType {
  SHORT_TEXT = 'SHORT_TEXT',
  EMAIL = 'EMAIL',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  PHONE_NUMBER = 'PHONE_NUMBER',
}

@Entity()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Form, (form) => form.questions)
  form!: Form;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.SHORT_TEXT,
  })
  type!: QuestionType;

  @Column()
  label!: string;

  @Column('simple-json', { nullable: true })
  options?: string[]; // For MULTIPLE_CHOICE
}