import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';

@Entity('post_reactions')
export class PostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reaction: string;

  /**
   * Remote actor id for an inbound federated Like, `null` for local users.
   *
   * The partial unique index on (postId, remoteActorUrl, reaction) makes
   * re-delivered activities no-ops. It is deliberately not a foreign key:
   * remote actors have no row here, and the LIKE target itself is the
   * anti-forgery check (only activities that pass signature verification
   * reach it).
   */
  @Column({ type: 'varchar', nullable: true })
  remoteActorUrl?: string | null;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Post, (post) => post.reactions)
  post: Post;
}
