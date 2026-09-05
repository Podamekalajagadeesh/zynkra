import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, ProfilePrivacy } from '../../users/entities/user.entity';
import { PostVisibility } from '../../posts/entities/post.entity';

/**
 * Central place for viewer-dependent visibility rules (blocks + private accounts).
 * Feed/posts/dms/comments inject this instead of duplicating join-table subqueries.
 */
@Injectable()
export class VisibilityService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Ids the viewer must never see content from (or be seen by):
   * union of "viewer blocked them" and "they blocked viewer".
   */
  async getBlockedIdSet(userId: string): Promise<Set<string>> {
    const rows: { id: string }[] = await this.usersRepository.query(
      `SELECT "blockedUserId" AS id FROM blocked_users WHERE "userId" = $1
       UNION
       SELECT "userId" AS id FROM blocked_users WHERE "blockedUserId" = $1`,
      [userId],
    );
    return new Set(rows.map((r) => r.id));
  }

  /** True when either user has blocked the other. */
  async isBlockedEither(a: string, b: string): Promise<boolean> {
    if (!a || !b || a === b) return false;
    const rows: { exists: boolean }[] = await this.usersRepository.query(
      `SELECT EXISTS(
         SELECT 1 FROM blocked_users
         WHERE ("userId" = $1 AND "blockedUserId" = $2)
            OR ("userId" = $2 AND "blockedUserId" = $1)
       ) AS exists`,
      [a, b],
    );
    return rows[0]?.exists === true;
  }

  /** True when follower follows target (accepted follow — the follows table only holds accepted rows). */
  async isFollowing(followerId: string, targetId: string): Promise<boolean> {
    if (!followerId || !targetId) return false;
    if (followerId === targetId) return true;
    const rows: { exists: boolean }[] = await this.usersRepository.query(
      `SELECT EXISTS(
         SELECT 1 FROM follows WHERE "followerId" = $1 AND "followingId" = $2
       ) AS exists`,
      [followerId, targetId],
    );
    return rows[0]?.exists === true;
  }

  /**
   * Ids of private-account authors whose posts the viewer may NOT see:
   * private accounts the viewer neither owns nor follows.
   * Computed against a candidate author id list so feeds can filter in one query.
   */
  async getHiddenPrivateAuthorIds(
    viewerId: string | null,
    candidateAuthorIds: string[],
  ): Promise<Set<string>> {
    const uniqueIds = [...new Set(candidateAuthorIds)].filter(Boolean);
    if (uniqueIds.length === 0) return new Set();
    const rows: { id: string }[] = await this.usersRepository.query(
      `SELECT u.id FROM users u
       WHERE u.id = ANY($1)
         AND u."profilePrivacy" = $2
         AND ($3::uuid IS NULL OR u.id != $3)
         AND ($3::uuid IS NULL OR NOT EXISTS(
           SELECT 1 FROM follows f WHERE f."followerId" = $3 AND f."followingId" = u.id
         ))`,
      [uniqueIds, ProfilePrivacy.PRIVATE, viewerId],
    );
    return new Set(rows.map((r) => r.id));
  }

  /** True when the viewer may see the target user's posts (owner, public account, or accepted follower). */
  async canViewAuthor(viewerId: string | null, authorId: string): Promise<boolean> {
    if (viewerId === authorId) return true;
    if (viewerId && (await this.isBlockedEither(viewerId, authorId))) return false;
    const hidden = await this.getHiddenPrivateAuthorIds(viewerId, [authorId]);
    return !hidden.has(authorId);
  }

  /** True when a viewer may see a user's presence and activity signals. */
  async canViewActivity(viewerId: string | null, target: Pick<User, 'id' | 'activityVisibility'>): Promise<boolean> {
    if (viewerId === target.id) return true;
    if (!viewerId || (await this.isBlockedEither(viewerId, target.id))) return false;
    if (target.activityVisibility === 'private') return false;
    if (target.activityVisibility === 'public') return true;

    const [viewerFollowsTarget, targetFollowsViewer] = await Promise.all([
      this.isFollowing(viewerId, target.id),
      this.isFollowing(target.id, viewerId),
    ]);
    return viewerFollowsTarget && targetFollowsViewer;
  }

  /** Apply post-level visibility after loading candidate posts. */
  async filterVisiblePostsForViewer<T extends { visibility?: PostVisibility; user?: { id?: string } }>(
    viewerId: string | null,
    posts: T[],
  ): Promise<T[]> {
    const visible: T[] = [];
    for (const post of posts) {
      const authorId = post.user?.id;
      if (!authorId) continue;
      if (viewerId && (await this.isBlockedEither(viewerId, authorId))) continue;
      if (!(await this.canViewAuthor(viewerId, authorId))) continue;
      if (viewerId === authorId || post.visibility === PostVisibility.PUBLIC) {
        visible.push(post);
        continue;
      }
      if (post.visibility === PostVisibility.FRIENDS || post.visibility === PostVisibility.PRIVATE) {
        const followsAuthor = viewerId ? await this.isFollowing(viewerId, authorId) : false;
        const followsViewer = viewerId ? await this.isFollowing(authorId, viewerId) : false;
        if (followsAuthor && followsViewer) visible.push(post);
      }
    }
    return visible;
  }

  /**
   * One-stop post-array filter used by the feed methods (they post-process arrays already):
   * drops posts from blocked users and from unfollowed private accounts.
   */
  async filterVisiblePosts<T extends { user?: { id?: string } }>(
    viewerId: string | null,
    posts: T[],
  ): Promise<T[]> {
    if (posts.length === 0) return posts;
    const authorIds = posts.map((p) => p.user?.id).filter(Boolean) as string[];
    const [blocked, hiddenPrivate] = await Promise.all([
      viewerId ? this.getBlockedIdSet(viewerId) : Promise.resolve(new Set<string>()),
      this.getHiddenPrivateAuthorIds(viewerId, authorIds),
    ]);
    if (blocked.size === 0 && hiddenPrivate.size === 0) return posts;
    return posts.filter((p) => {
      const authorId = p.user?.id;
      if (!authorId) return true;
      return !blocked.has(authorId) && !hiddenPrivate.has(authorId);
    });
  }
}
