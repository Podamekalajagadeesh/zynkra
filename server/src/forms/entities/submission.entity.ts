
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Form } from './form.entity';

@Entity()
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Form, (form) => form.submissions)
  form!: Form;

  @Column({ nullable: true })
  submitterId?: string;

  @CreateDateColumn()
  submittedAt!: Date;
}