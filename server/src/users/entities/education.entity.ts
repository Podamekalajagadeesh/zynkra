import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  school: string;

  @Column()
  degree: string;

  @Column({ nullable: true })
  fieldOfStudy: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column()
  userId: string;
}