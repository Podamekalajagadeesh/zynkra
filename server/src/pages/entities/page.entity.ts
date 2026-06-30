import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PageMember } from './page-member.entity';
import { Post } from '../../posts/entities/post.entity';
import { PageConversation } from './page-conversation.entity';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: false })
  automatedResponseEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  automatedResponseMessage: string;

  @ManyToOne(() => User, (user) => user.ownedPages)
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => PageMember, (member) => member.page)
  members: PageMember[];

  @OneToMany(() => Post, (post) => post.page)
  posts: Post[];

  @OneToMany(() => PageConversation, (conversation) => conversation.page)
  conversations: PageConversation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}