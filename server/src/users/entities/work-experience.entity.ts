import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('work_experiences')
export class WorkExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column()
  userId: string;
}