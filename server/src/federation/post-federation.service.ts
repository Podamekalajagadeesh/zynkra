import { Injectable, Logger, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Post, PostVisibility } from '../posts/entities/post.entity';

/**
 * Decides which of a user's remote followers should receive a newly created
 * post, and drives the delivery.
 *
 * `FederationService` lives in `federation/`, which imports `PostsModule` (it
 * needs `PostsService` to build a local outbox). Injecting it into `PostsService`
 * directly would create a module cycle — `PostsModule` → `FederationModule` →
 * `PostsModule` — so the reference is resolved lazily through `ModuleRef` inside
 * a `forwardRef` import. The cycle is real, not hypothetical: federation
 * genuinely needs posts, and now posts need federation.
 *
 * A misconfigured or unreachable federation service therefore must never break
 * post creation. Every failure path here logs and returns; `createPost` is not
 * wrapped in a transaction with the fan-out, and must not become one.
 */
@Injectable()
export class PostFederationService {
  private readonly logger = new Logger(PostFederationService.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly configService: ConfigService
  ) {}

  /** Federation is opt-in and off by default, matching FEDERATION_ENABLED. */
  isEnabled(): boolean {
    return this.configService.get<string>('FEDERATION_ENABLED', 'false') === 'true';
  }

  /**
   * Propagate a deletion to the author's remote followers.
   *
   * Without this, every remote copy of a deleted post outlived the original —
   * the local instance could publish a post and then be unable to retract it,
   * which is the one guarantee federation must not break.
   *
   * Fire-and-forget for the same reason as create: the local post is already
   * gone, and a peer being unreachable must not fail the delete.
   */
  federatePostDeletion(postId: string, authorId: string): void {
    if (!this.isEnabled()) return;

    void this.dispatchDeletion(postId, authorId).catch((error) => {
      this.logger.error(`Failed to federate deletion of post ${postId}`, error);
    });
  }

  private async dispatchDeletion(postId: string, authorId: string): Promise<void> {
    const federationService = this.moduleRef.get('FederationService', { strict: false });
    if (!federationService) {
      this.logger.warn('FederationService is not available — deletion not federated');
      return;
    }

    const targets = await federationService.getFollowerInstanceDomains(authorId);
    if (!Array.isArray(targets) || targets.length === 0) return;

    const report = await federationService.federateDelete(authorId, postId, targets);

    if (report.skipped) {
      this.logger.log(`Post ${postId} was never federated — no Delete emitted (${report.reason})`);
      return;
    }

    this.logger.log(
      `Federated Delete for post ${postId} to ${report.delivered}/${report.requested} instance(s)`
    );
  }

  /**
   * Propagate an edit of a local post to every peer that received it.
   *
   * `federateUpdate` resolves the recipients from the outbox rather than the
   * current follower list, so an edit reaches exactly the instances that hold a
   * copy of the original — including one the author has since unfollowed, which
   * would otherwise be left showing stale content forever.
   *
   * Fire-and-forget and non-throwing for the same reason as create: the edit is
   * already saved and returned, and a dead peer must not fail it.
   */
  federatePostUpdate(post: Post, authorId: string): void {
    if (!this.isEnabled()) return;
    if (post.isDraft) return;
    if (post.isAnonymous) return;
    if (post.isEncrypted) return;
    if (post.visibility !== PostVisibility.PUBLIC) return;
    if (!post.content || post.content === '[Encrypted Content]') return;

    void this.dispatchUpdate(post, authorId).catch((error) => {
      this.logger.error(`Failed to federate update of post ${post.id}`, error);
    });
  }

  private async dispatchUpdate(post: Post, authorId: string): Promise<void> {
    const federationService = this.moduleRef.get('FederationService', { strict: false });
    if (!federationService) {
      this.logger.warn('FederationService is not available — post update not federated');
      return;
    }

    const report = await federationService.federateUpdate(authorId, String(post.id), post.content);

    if (report.skipped) {
      this.logger.log(`Post ${post.id} update not federated: ${report.reason}`);
      return;
    }

    this.logger.log(
      `Federated Update for post ${post.id} to ${report.delivered}/${report.requested} instance(s)`
    );
  }

  /**
   * Fan a newly created public post out to the given instances.
   *
   * Deliberately narrow about what federates:
   *  - only `PUBLIC` posts. A followers-only or private post must never leave
   *    the instance; federating one would leak it to every connected peer.
   *  - never encrypted posts. The content is `[Encrypted Content]`, and the
   *    ciphertext is keyed to a recipient set that does not exist remotely.
   *  - never anonymous posts — there is no author to attribute the activity to.
   *  - never drafts.
   *
   * Fire-and-forget: the caller does not await this, so a slow or dead peer
   * cannot delay a user's post from appearing.
   */
  federateNewPost(post: Post, authorId: string): void {
    if (!this.isEnabled()) return;

    if (post.isDraft) return;
    if (post.isAnonymous) return;
    if (post.isEncrypted) return;
    if (post.visibility !== PostVisibility.PUBLIC) return;
    if (!post.content || post.content === '[Encrypted Content]') return;

    void this.dispatch(post, authorId).catch((error) => {
      // Swallowed on purpose: post creation has already succeeded and returned
      // to the client. Surfacing this would mean rolling back a saved post
      // because a third-party server is down.
      this.logger.error(`Failed to federate post ${post.id}`, error);
    });
  }

  private async dispatch(post: Post, authorId: string): Promise<void> {
    // Resolved lazily to break the module cycle described above.
    const federationService = this.moduleRef.get('FederationService', { strict: false });
    if (!federationService) {
      this.logger.warn('FederationService is not available — post not federated');
      return;
    }

    const targets = await federationService.getFollowerInstanceDomains(authorId);
    if (!Array.isArray(targets) || targets.length === 0) {
      this.logger.log(`No remote followers for author ${authorId} — nothing to federate`);
      return;
    }

    const report = await federationService.federatePost(
      authorId,
      {
        activityId: String(post.id),
        content: post.content,
        publishedAt: post.createdAt ?? new Date(),
      } as any,
      targets
    );

    this.logger.log(
      `Federated post ${post.id} to ${report.delivered}/${report.requested} instance(s)` +
        (report.failed > 0 ? ` (${report.failed} failed)` : '')
    );
  }
}
