import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Page } from './page.entity';
import { PageRole } from '../roles.enum';

@Entity('page_members')
@Unique(['pageId', 'userId'])
export class PageMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Page, (page) => page.members, { onDelete: 'CASCADE' })
  page: Page;

  @Column()
  pageId: string;

  @ManyToOne(() => User, (user) => user.pageMemberships, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: PageRole,
    default: PageRole.MODERATOR,
  })
  role: PageRole;
}