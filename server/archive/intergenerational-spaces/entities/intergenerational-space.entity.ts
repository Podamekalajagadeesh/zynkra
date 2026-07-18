import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AgeGroup {
  YOUTH = 'youth',
  ADULT = 'adult',
  SENIOR = 'senior',
}

export enum KnowledgeFocus {
  TRADITIONS = 'traditions',
  SKILLS = 'skills',
  HISTORY = 'history',
  CULTURE = 'culture',
  TECHNOLOGY = 'technology',
}

@Entity('intergenerational_spaces')
export class IntergenerationalSpace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: KnowledgeFocus,
  })
  focus: KnowledgeFocus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  goals?: string[];

  @Column({ type: 'simple-array', nullable: true })
  includedAgeGroups?: AgeGroup[];

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('intergenerational_space_members')
export class IntergenerationalSpaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  spaceId: string;

  @ManyToOne(() => IntergenerationalSpace)
  @JoinColumn({ name: 'spaceId' })
  space?: IntergenerationalSpace;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: AgeGroup,
  })
  ageGroup: AgeGroup;

  @Column({ type: 'text', nullable: true })
  expertise?: string;

  @Column({ type: 'text', nullable: true })
  learningGoals?: string;

  @CreateDateColumn()
  joinedAt: Date;
}
