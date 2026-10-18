import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost, ActivityType } from './entities/remote-post.entity';
import { FederationModeration } from './entities/federation-moderation.entity';
import { FederationFollow } from './entities/federation-follow.entity';
import { FederationOutbox } from './entities/federation-outbox.entity';
import { ConnectInstanceDto, RemoteInstanceDto } from './dto/remote-instance.dto';
import { FederatePostDto, FederateFollowDto } from './dto/federate-post.dto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { User } from '../users/entities/user.entity';
import { HttpSignaturesService } from './http-signatures.service';
import { randomUUID } from 'crypto';
import axios from 'axios';

/** Outcome of a single delivery attempt to one remote inbox. */
export interface DeliveryResult {
  domain?: string;
  delivered: boolean;
  /** True when no request was made (no baseUrl, blocked, or not connected). */
  skipped?: boolean;
  attempts?: number;
  status?: number;
  reason?: string;
  retryable?: boolean;
}

/** Per-instance report returned by `federatePost` / `federateDelete` / `federateAnnounce`. */
export interface FederationReport {
  activityId: string;
  requested: number;
  delivered: number;
  failed: number;
  results: DeliveryResult[];
  /** True when nothing was sent at all (e.g. the post was never federated). */
  skipped?: boolean;
  reason?: string;
}

/** One remote post rendered for display, normalized away from the storage shape. */
export interface FederatedTimelineItem {
  id: string;
  content: string;
  publishedAt: Date;
  inReplyToId: string | null;
  mediaUrls: string[];
  mentions: string[];
  tags: string[];
  likeCount: number;
  shareCount: number;
  /** Always true — present so a client can render remote and local posts uniformly. */
  isFederated: true;
  author: {
    actorId: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  instance: { domain: string; baseUrl: string; software: string | null } | null;
}

@Injectable()
export class FederationService implements OnModuleInit {
  private readonly logger = new Logger(FederationService.name);
  private readonly instanceDomain: string;
  private readonly instanceBaseUrl: string;
  private readonly federationEnabled: boolean;
  private readonly defaultDeliveryRetries = 3;
  private readonly defaultDeliveryRetryDelayMs = 200;
  private readonly maxDeliveryRetryDelayMs = 30_000;

  constructor(
    @InjectRepository(RemoteInstance)
    private readonly instanceRepository: Repository<RemoteInstance>,
    @InjectRepository(RemoteUser)
    private readonly remoteUserRepository: Repository<RemoteUser>,
    @InjectRepository(RemotePost)
    private readonly remotePostRepository: Repository<RemotePost>,
    @InjectRepository(FederationModeration)
    private readonly moderationRepository: Repository<FederationModeration>,
    @InjectRepository(FederationFollow)
    private readonly followRepository: Repository<FederationFollow>,
    @InjectRepository(FederationOutbox)
    private readonly outboxRepository: Repository<FederationOutbox>,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly postsService: PostsService,
    private readonly httpSignaturesService: HttpSignaturesService,
  ) {
    this.instanceDomain = this.configService.get<string>('INSTANCE_DOMAIN', 'zynkra.local');
    this.instanceBaseUrl = this.configService.get<string>('INSTANCE_BASE_URL', 'http://localhost:3001');
    this.federationEnabled = this.configService.get<string>('FEDERATION_ENABLED', 'false') === 'true';
  }

  async onModuleInit(): Promise<void> {
    await this.httpSignaturesService.initialize();
    if (this.federationEnabled) {
      this.logger.log('Outbound federation is ENABLED — HTTP Signatures active (draft-cavage-http-signatures-10)');
      // Inbound verification is on by default whenever federation is on. Saying
      // so explicitly matters: a peer that does not sign correctly will now get
      // 401 rather than being silently accepted, and an operator reading the
      // boot log should not have to find that out from a failed delivery.
      this.logger.log(
        this.httpSignaturesService.isInboundVerificationRequired()
          ? 'Inbound activity verification is ENABLED — unsigned or forged activities will be rejected with 401'
          : 'Inbound activity verification is DISABLED (FEDERATION_VERIFY_INBOUND=false) — the inbox will accept unsigned activities',
      );
    } else {
      this.logger.warn('Outbound federation is DISABLED — set FEDERATION_ENABLED=true to enable. Disabled by default — this is expected for new instances.');
    }
  }

  /** Check the federation guard — throws if outbound federation is disabled. */
  private assertFederationEnabled(): void {
    if (!this.federationEnabled) {
      throw new HttpException(
        'Outbound federation is disabled. Set FEDERATION_ENABLED=true and restart.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getConnectedInstances(): Promise<RemoteInstance[]> {
    return this.instanceRepository.find({
      where: { isBlocked: false },
      relations: ['remoteUsers'],
    });
  }

  async discoverInstance(domain: string): Promise<RemoteInstanceDto> {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${normalizedDomain}`;

    try {
      const wellKnownUrl = `${baseUrl}/.well-known/nodeinfo`;
      const nodeInfoResponse = await axios.get(wellKnownUrl, { timeout: 5000 });

      let nodeInfoUrl = nodeInfoResponse.data.links?.find(
        (link: any) => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0',
      )?.href;

      if (!nodeInfoUrl) {
        nodeInfoUrl = `${baseUrl}/nodeinfo/2.0`;
      }

      const nodeInfo = await axios.get(nodeInfoUrl, { timeout: 5000 });

      try {
        await axios.get(`${baseUrl}/.well-known/webfinger?resource=acct:local@${normalizedDomain}`, { timeout: 5000 });
      } catch {
        this.logger.warn(`Webfinger probe for ${normalizedDomain} did not return a usable response`);
      }

      return {
        domain: normalizedDomain,
        name: nodeInfo.data?.metadata?.nodeName || normalizedDomain,
        description: nodeInfo.data?.metadata?.nodeDescription || '',
        baseUrl,
        software: nodeInfo.data?.software?.name,
        version: nodeInfo.data?.software?.version,
        isVerified: true,
      };
    } catch (error) {
      this.logger.error(`Failed to discover instance ${domain}:`, error);
      throw new HttpException(
        `Could not discover instance at ${domain}. Verify it is a valid ActivityPub compatible server.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async connectToInstance(connectDto: ConnectInstanceDto): Promise<RemoteInstance> {
    const existingInstance = await this.instanceRepository.findOne({
      where: { domain: connectDto.domain },
    });

    if (existingInstance) {
      if (existingInstance.isBlocked) {
        throw new HttpException('This instance is blocked', HttpStatus.FORBIDDEN);
      }
      return existingInstance;
    }

    let instanceInfo: Partial<RemoteInstanceDto> | null = null;

    try {
      instanceInfo = await this.discoverInstance(connectDto.domain);
    } catch (error) {
      this.logger.warn(`Falling back to a minimal instance record for ${connectDto.domain}`, error);
      instanceInfo = {
        domain: connectDto.domain,
        name: connectDto.domain,
        description: '',
        baseUrl: connectDto.baseUrl || `https://${connectDto.domain}`,
        software: null,
        version: null,
        isVerified: false,
      };
    }

    const instance = this.instanceRepository.create({
      ...instanceInfo,
      lastSyncAt: new Date(),
    });

    return this.instanceRepository.save(instance);
  }

  private async fetchRemoteJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const response = await axios.get<T>(url, {
      headers: {
        Accept: 'application/activity+json, application/ld+json',
        ...headers,
      },
      timeout: 5000,
    });

    return response.data;
  }

  async fetchRemoteUser(actorId: string): Promise<RemoteUser> {
    const existingUser = await this.remoteUserRepository.findOne({
      where: { actorId },
      relations: ['instance'],
    });

    if (existingUser) {
      return existingUser;
    }

    try {
      // Use signed GET if federation is enabled
      let actor: any;
      if (this.federationEnabled) {
        const signedHeaders = this.httpSignaturesService.getSignedGetHeaders(
          `${this.instanceBaseUrl}/federation/users/local`,
          actorId,
        );
        actor = await this.fetchRemoteJson<any>(actorId, signedHeaders);
      } else {
        actor = await this.fetchRemoteJson<any>(actorId);
      }

      const domain = new URL(actorId).hostname;
      let instance = await this.instanceRepository.findOne({ where: { domain } });

      if (!instance) {
        instance = await this.connectToInstance({
          domain,
          baseUrl: `https://${domain}`,
        });
      }

      const remoteUser = this.remoteUserRepository.create({
        actorId,
        username: actor.preferredUsername,
        name: actor.name,
        summary: actor.summary,
        avatarUrl: actor.icon?.url,
        headerUrl: actor.image?.url,
        inboxUrl: actor.inbox,
        outboxUrl: actor.outbox,
        followersUrl: actor.followers,
        followingUrl: actor.following,
        instance,
      });

      return this.remoteUserRepository.save(remoteUser);
    } catch (error) {
      this.logger.error(`Failed to fetch remote user ${actorId}:`, error);
      throw new HttpException('Could not fetch remote user', HttpStatus.BAD_REQUEST);
    }
  }

  async fetchRemotePost(activityId: string): Promise<RemotePost> {
    const existingPost = await this.remotePostRepository.findOne({
      where: { activityId },
      relations: ['author', 'instance'],
    });

    if (existingPost) {
      return existingPost;
    }

    try {
      // Use signed GET if federation is enabled
      let activity: any;
      if (this.federationEnabled) {
        const signedHeaders = this.httpSignaturesService.getSignedGetHeaders(
          `${this.instanceBaseUrl}/federation/users/local`,
          activityId,
        );
        activity = await this.fetchRemoteJson<any>(activityId, signedHeaders);
      } else {
        activity = await this.fetchRemoteJson<any>(activityId);
      }

      let author: RemoteUser | null = null;
      let instance: RemoteInstance | null = null;

      try {
        author = await this.fetchRemoteUser(activity.actor);
        instance = author?.instance || null;
      } catch (error) {
        this.logger.warn(`Unable to resolve remote author for ${activityId}; continuing with minimal persistence`, error);
      }

      const domain = new URL(activityId).hostname;
      instance = instance || (await this.instanceRepository.findOne({ where: { domain } }));

      if (!instance) {
        const discoveredInstance = await this.getOrCreateInstanceFromActor(activity.actor || activityId);
        instance = discoveredInstance || null;
      }

      if (!instance) {
        throw new HttpException('Instance not found', HttpStatus.NOT_FOUND);
      }

      const object = activity.object || activity;

      const remotePost = this.remotePostRepository.create({
        activityId,
        activityType: activity.type as ActivityType,
        content: object.content || '',
        inReplyToId: object.inReplyTo,
        author,
        instance,
        mediaUrls: object.attachment?.map((a: any) => a.url),
        mentions: object.tag?.filter((t: any) => t.type === 'Mention').map((t: any) => t.href),
        tags: object.tag?.filter((t: any) => t.type === 'Hashtag').map((t: any) => t.name),
        publishedAt: new Date(object.published),
      });

      return this.remotePostRepository.save(remotePost);
    } catch (error) {
      this.logger.error(`Failed to fetch remote post ${activityId}:`, error);
      throw new HttpException('Could not fetch remote post', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Fan a post out to the given instances.
   *
   * This previously logged per-instance failures and returned `void`, so a
   * caller could not tell "delivered to all four peers" from "delivered to
   * none" — a total federation outage looked identical to success. It now
   * returns a per-instance report, and the caller (`federation.controller.ts`)
   * surfaces it.
   */
  async federatePost(
    localUserId: string,
    federateDto: FederatePostDto,
    targetInstances: string[],
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const noteId = `${this.instanceBaseUrl}/federation/posts/${federateDto.activityId}`;

    const activity = await this.buildActivity(
      'Create',
      localUserId,
      {
        ...federateDto,
        type: 'Note',
        // The Note needs its own stable id, and it must match what
        // `federateDelete` and `federateUpdate` later reference. Both look the
        // Note up through the outbox, which indexes on this value.
        id: noteId,
        content: federateDto.content,
        published: federateDto.publishedAt?.toISOString?.() || new Date().toISOString(),
        to: federateDto.to || ['https://www.w3.org/ns/activitystreams#Public'],
        cc: federateDto.cc || [],
      },
      { to: federateDto.to, cc: federateDto.cc },
    );

    const report = await this.fanOut(localUserId, activity, targetInstances);

    // Record what we sent. A failure here only costs us the ability to
    // retract or edit later; it must not fail the delivery that already
    // happened.
    await this.recordOutboundActivity({
      activityId: activity.id,
      objectId: noteId,
      activityType: 'Create',
      localUserId,
      deliveredTo: report.results.filter((r) => r.delivered).map((r) => r.domain ?? ''),
    });

    return report;
  }

  /**
   * Tell peers a post no longer exists.
   *
   * Deleting a local post previously propagated nothing, so every remote copy
   * outlived the original indefinitely — the local instance could retract a post
   * it had federated, which is the one thing federation must not allow.
   *
   * ActivityPub models this as `Delete` wrapping the *original* `Create`
   * activity's id, not the Note id, so a peer that received the Create can match
   * and remove it. `federatePost` records what it sent in the outbox, and this
   * looks that up by Note id rather than guessing it.
   */
  async federateDelete(
    localUserId: string,
    postId: string,
    targetInstances: string[],
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const noteId = `${this.instanceBaseUrl}/federation/posts/${postId}`;
    const sent = await this.findOutboundActivity(noteId, 'Create');
    if (!sent) {
      // Never sent, or the record is gone. Emitting a Delete for an activity the
      // peer never received is noise, not correctness.
      return {
        activityId: '',
        requested: targetInstances.length,
        delivered: 0,
        failed: 0,
        results: [],
        skipped: true,
        reason: 'no recorded federated activity for this post',
      } as FederationReport;
    }

    const activity = await this.buildActivity('Delete', localUserId, {
      id: sent.activityId,
      type: 'Tombstone',
      // Mastodon looks for this to confirm the Delete was authorized by the
      // actor that created the object.
      formerType: 'Note',
    });

    // Prefer the instances that actually accepted the Create. Retracting from a
    // peer that never got the original is wasted work, and a peer that did get
    // it but is missing from the caller's current follower list would otherwise
    // keep a copy we can no longer reach.
    const targets = sent.deliveredTo?.length ? sent.deliveredTo : targetInstances;

    return this.fanOut(localUserId, activity, targets);
  }

  /**
   * Propagate an edit of an already-federated post.
   *
   * `Update` carries the same object id as the `Create` it revises — a peer
   * matches on that id, so a new one would create a second post instead of
   * editing the first.
   *
   * Like `Delete`, it is a no-op for a post that was never federated: there is
   * nothing on any peer to correct.
   */
  async federateUpdate(
    localUserId: string,
    postId: string,
    content: string,
    targetInstances: string[] = [],
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const noteId = `${this.instanceBaseUrl}/federation/posts/${postId}`;
    const sent = await this.findOutboundActivity(noteId, 'Create');
    if (!sent) {
      return {
        activityId: '',
        requested: 0,
        delivered: 0,
        failed: 0,
        results: [],
        skipped: true,
        reason: 'post was never federated, so there is nothing to update',
      } as FederationReport;
    }

    if (!content || content === '[Encrypted Content]') {
      return {
        activityId: '',
        requested: 0,
        delivered: 0,
        failed: 0,
        results: [],
        skipped: true,
        reason: 'no publishable content to update with',
      } as FederationReport;
    }

    const activity = await this.buildActivity('Update', localUserId, {
      id: noteId,
      type: 'Note',
      content,
      // The original `published` is immutable; a peer that re-rendered the post
      // timeline position on an edit would reshuffle every remote timeline.
      published: sent.createdAt?.toISOString?.() ?? new Date().toISOString(),
    });

    const targets = sent.deliveredTo?.length ? sent.deliveredTo : targetInstances;
    const report = await this.fanOut(localUserId, activity, targets);

    await this.recordOutboundActivity({
      activityId: activity.id,
      objectId: noteId,
      activityType: 'Update',
      localUserId,
      deliveredTo: report.results.filter((r) => r.delivered).map((r) => r.domain ?? ''),
    });

    return report;
  }

  // ---- Outbound activity ledger -------------------------------------------

  /**
   * Remember an activity we sent, so a later `Undo`/`Update`/`Delete` can
   * reference the exact id a peer received.
   *
   * Best-effort by design. A failed write costs the ability to retract, which
   * is strictly better than turning a delivery that already succeeded into an
   * error the caller sees.
   */
  private async recordOutboundActivity(params: {
    activityId: string;
    objectId: string;
    activityType: string;
    localUserId: string;
    deliveredTo: string[];
  }): Promise<void> {
    try {
      await this.outboxRepository.save(
        this.outboxRepository.create({
          activityId: params.activityId,
          objectId: params.objectId,
          activityType: params.activityType,
          localUser: { id: params.localUserId } as any,
          deliveredTo: params.deliveredTo,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Delivered ${params.activityType} ${params.activityId} but could not record it; it cannot be retracted or revised federated`,
        error,
      );
    }
  }

  /** The most recent activity of `activityType` we sent about `objectId`. */
  private async findOutboundActivity(
    objectId: string,
    activityType: string,
  ): Promise<FederationOutbox | null> {
    try {
      const found = await this.outboxRepository.findOne({
        where: { objectId, activityType },
        order: { createdAt: 'DESC' },
      });
      return found ?? null;
    } catch (error) {
      this.logger.warn(
        `Unable to resolve outbound ${activityType} for ${objectId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Shared instance fan-out, used by the activities whose audience is this
   * user's remote followers: `Create`, `Update`, and `Delete`.
   *
   * `Like`, `Announce`, and their `Undo`s deliberately do **not** come through
   * here — those are addressed to the author of the object they act on, and
   * fanning them out to follower instances would tell every peer something that
   * was not addressed to them.
   */
  private async fanOut(
    localUserId: string,
    activity: any,
    targetInstances: string[],
  ): Promise<FederationReport> {
    const results: DeliveryResult[] = [];
    const actorUsername = (await this.getLocalActorUsername(localUserId)) ?? undefined;

    for (const instanceDomain of targetInstances) {
      const instance = await this.instanceRepository.findOne({
        where: { domain: instanceDomain, isBlocked: false },
      });

      if (!instance) {
        results.push({
          domain: instanceDomain,
          delivered: false,
          skipped: true,
          reason: 'instance is not connected or is blocked',
        });
        continue;
      }

      try {
        const outcome = await this.deliverToInbox(instance, activity, { actorUsername });
        results.push({ domain: instanceDomain, ...outcome });

        if (outcome.delivered) {
          this.logger.log(`Delivered ${activity.type} to ${instanceDomain}`);
        } else {
          this.logger.warn(
            `${activity.type} to ${instanceDomain} not delivered: ${outcome.reason ?? 'unknown'}`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to deliver ${activity.type} to ${instanceDomain}:`, error);
        results.push({
          domain: instanceDomain,
          delivered: false,
          reason: (error as Error).message,
        });
      }
    }

    const delivered = results.filter((r) => r.delivered).length;
    return {
      activityId: activity.id,
      requested: targetInstances.length,
      delivered,
      failed: results.length - delivered,
      results,
    };
  }

  /**
   * Boost a remote post to this instance's followers.
   *
   * `Announce` is how a boost crosses instances: the announcing actor is the
   * *local* user, and the object is the original remote activity id. Sending the
   * remote Note itself would duplicate it as a new post rather than a boost.
   *
   * An `Announce` is addressed to the original author — that is who needs to
   * know their post was boosted — so unlike `Create` it does not go to the
   * local user's follower instances.
   */
  async federateAnnounce(
    localUserId: string,
    remoteActivityId: string,
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const target = await this.resolveRemoteObject(remoteActivityId);
    if (!target) {
      return this.skippedReport(`no known remote object ${remoteActivityId}`);
    }

    const activity = await this.buildActivity('Announce', localUserId, remoteActivityId, {
      to: [target.actorActorId],
    });

    const report = await this.deliverToObjectOwner(localUserId, activity, target);

    await this.recordOutboundActivity({
      activityId: activity.id,
      objectId: remoteActivityId,
      activityType: 'Announce',
      localUserId,
      deliveredTo: report.results.filter((r) => r.delivered).map((r) => r.domain ?? ''),
    });

    return report;
  }

  /**
   * Retract a boost.
   *
   * `Undo` must wrap the `Announce` the peer actually received, so this looks
   * the recorded activity up rather than minting a fresh object — a peer that
   * cannot match the id simply ignores the Undo and the boost stays.
   */
  async federateUndoAnnounce(
    localUserId: string,
    remoteActivityId: string,
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const sent = await this.findOutboundActivity(remoteActivityId, 'Announce');
    if (!sent) {
      return this.skippedReport('this boost was never federated, so there is nothing to undo');
    }

    const target = await this.resolveRemoteObject(remoteActivityId);
    if (!target) {
      return this.skippedReport(`no known remote object ${remoteActivityId}`);
    }

    const activity = await this.buildActivity(
      'Undo',
      localUserId,
      { id: sent.activityId, type: 'Announce', object: remoteActivityId },
      { to: [target.actorActorId] },
    );

    return this.deliverToObjectOwner(localUserId, activity, target);
  }

  /**
   * Like a remote post.
   *
   * `Like` is delivered to the inbox of the actor who *owns* the object, not to
   * this user's followers. Fanning it out to follower instances — the shape
   * `Create` uses — would tell every peer the local user liked something, which
   * is both noise and a privacy leak.
   */
  async federateLike(
    localUserId: string,
    remoteActivityId: string,
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const target = await this.resolveRemoteObject(remoteActivityId);
    if (!target) {
      return this.skippedReport(`no known remote object ${remoteActivityId}`);
    }

    // Idempotent: a double-tap must not send a second Like. Mastodon treats a
    // duplicate Like as an error, and a retried request would look like spam.
    const existing = await this.findOutboundActivity(remoteActivityId, 'Like');
    if (existing) {
      return {
        activityId: existing.activityId,
        requested: 0,
        delivered: 0,
        failed: 0,
        results: [],
        skipped: true,
        reason: 'already federated a Like for this object',
      } as FederationReport;
    }

    const activity = await this.buildActivity(
      'Like',
      localUserId,
      remoteActivityId,
      // `cc: []` is explicit, not a default. `buildActivity` falls back to the
      // actor's followers collection for `cc`, and a Like has no audience
      // beyond the author of the object.
      { to: [target.actorActorId], cc: [] },
    );

    const report = await this.deliverToObjectOwner(localUserId, activity, target);

    await this.recordOutboundActivity({
      activityId: activity.id,
      objectId: remoteActivityId,
      activityType: 'Like',
      localUserId,
      deliveredTo: report.results.filter((r) => r.delivered).map((r) => r.domain ?? ''),
    });

    return report;
  }

  /**
   * Unlike a remote post.
   *
   * Without this a federated `Like` is permanent on the remote author's server:
   * there is no way to take it back, which is exactly the guarantee federation
   * must not break.
   */
  async federateUndoLike(
    localUserId: string,
    remoteActivityId: string,
  ): Promise<FederationReport> {
    this.assertFederationEnabled();

    const sent = await this.findOutboundActivity(remoteActivityId, 'Like');
    if (!sent) {
      return this.skippedReport('this like was never federated, so there is nothing to undo');
    }

    const target = await this.resolveRemoteObject(remoteActivityId);
    if (!target) {
      return this.skippedReport(`no known remote object ${remoteActivityId}`);
    }

    const activity = await this.buildActivity(
      'Undo',
      localUserId,
      { id: sent.activityId, type: 'Like', object: remoteActivityId },
      { to: [target.actorActorId] },
    );

    return this.deliverToObjectOwner(localUserId, activity, target);
  }

  /**
   * Resolve a remote activity id to the actor that owns it, so a Like or a
   * boost can be addressed to the right inbox.
   *
   * Fetches the object if we have never seen it, which is what makes a boost
   * work for a post the user was shown by a client that knows the id but never
   * had it persisted here.
   */
  private async resolveRemoteObject(
    activityId: string,
  ): Promise<{ actorActorId: string; inboxUrl?: string; instanceDomain?: string } | null> {
    let post: RemotePost | null = null;
    try {
      post = await this.fetchRemotePost(activityId);
    } catch (error) {
      this.logger.warn(`Unable to resolve remote object ${activityId}`, error);
      return null;
    }

    const actorActorId = post?.author?.actorId;
    if (!actorActorId) {
      return null;
    }

    return {
      actorActorId,
      inboxUrl: post.author?.inboxUrl ?? undefined,
      instanceDomain: post.instance?.domain ?? undefined,
    };
  }

  /**
   * Deliver a Like/Announce/Undo to the owning actor's inbox.
   *
   * Blocked instances are refused here exactly as they are in `fanOut` — a user
   * who blocked an instance must not keep sending it traffic, and an instance
   * level block that only covered `Create` would be an easy bypass.
   */
  private async deliverToObjectOwner(
    localUserId: string,
    activity: any,
    target: { actorActorId: string; inboxUrl?: string; instanceDomain?: string },
  ): Promise<FederationReport> {
    const actorUsername = (await this.getLocalActorUsername(localUserId)) ?? undefined;

    if (!target.inboxUrl) {
      return {
        activityId: activity.id,
        requested: 0,
        delivered: 0,
        failed: 0,
        results: [
          {
            domain: target.instanceDomain,
            delivered: false,
            skipped: true,
            reason: 'the remote actor has no known inbox',
          },
        ],
      } as FederationReport;
    }

    try {
      if (target.instanceDomain) {
        const instance = await this.instanceRepository.findOne({
          where: { domain: target.instanceDomain, isBlocked: false },
        });
        if (!instance) {
          return {
            activityId: activity.id,
            requested: 1,
            delivered: 0,
            failed: 1,
            results: [
              {
                domain: target.instanceDomain,
                delivered: false,
                skipped: true,
                reason: 'instance is not connected or is blocked',
              },
            ],
          } as FederationReport;
        }
      }

      const outcome = await this.deliverToInbox(
        // The instance object is irrelevant here — the actor's own inbox is the
        // target, and passing it via `inboxUrl` keeps `deliverToInbox` from
        // deriving `${baseUrl}/inbox` and overwriting it.
        {},
        activity,
        { actorUsername, inboxUrl: target.inboxUrl },
      );

      return {
        activityId: activity.id,
        requested: 1,
        delivered: outcome.delivered ? 1 : 0,
        failed: outcome.delivered ? 0 : 1,
        results: [{ domain: target.instanceDomain, ...outcome }],
      } as FederationReport;
    } catch (error) {
      this.logger.error(`Failed to deliver ${activity.type} to ${target.actorActorId}:`, error);
      return {
        activityId: activity.id,
        requested: 1,
        delivered: 0,
        failed: 1,
        results: [
          {
            domain: target.instanceDomain,
            delivered: false,
            reason: (error as Error).message,
          },
        ],
      } as FederationReport;
    }
  }

  /** A report for "we deliberately sent nothing", so callers never see a throw. */
  private skippedReport(reason: string, requested = 0): FederationReport {
    return {
      activityId: '',
      requested,
      delivered: 0,
      failed: 0,
      results: [],
      skipped: true,
      reason,
    } as FederationReport;
  }

  async sendFollow(followDto: FederateFollowDto, localUserId: string) {
    this.assertFederationEnabled();

    const targetUser = await this.fetchRemoteUser(followDto.objectId);
    if (!targetUser?.inboxUrl) {
      throw new HttpException('Cannot follow this user: no inbox URL found', HttpStatus.BAD_REQUEST);
    }

    const followActivity = await this.buildActivity('Follow', localUserId, {
      object: followDto.objectId,
    });

    const actorUsername = (await this.getLocalActorUsername(localUserId)) || 'local';
    const actorUrl = `${this.instanceBaseUrl}/federation/users/${actorUsername}`;

    // Routed through deliverToInbox rather than a bare axios.post, so a Follow
    // gets the same retry/backoff and non-retryable-status handling as a post.
    // It also now reports *why* a delivery failed instead of collapsing every
    // error into "Failed to follow remote user".
    const outcome = await this.deliverToInbox(
      { baseUrl: new URL(targetUser.inboxUrl).origin },
      followActivity,
      { actorUsername, inboxUrl: targetUser.inboxUrl },
    );

    if (!outcome.delivered) {
      this.logger.error(
        `Follow to ${targetUser.username} not delivered: ${outcome.reason ?? 'unknown'}`,
      );
      throw new HttpException(
        `Failed to follow remote user: ${outcome.reason ?? 'delivery failed'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.log(`Follow sent to ${targetUser.username}@${targetUser.instance.domain}`);
    return {
      success: true,
      attempts: outcome.attempts,
      message: `Following ${targetUser.username}@${targetUser.instance.domain}`,
    };
  }

  private async buildActivity(
    type: string,
    localUserId: string,
    object: any,
    overrides: { to?: string[]; cc?: string[] } = {},
  ) {
    const user = await this.userService.findOneById(localUserId);
    const actorUsername = user?.username || localUserId;

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      // randomUUID, not Date.now(). A millisecond timestamp collides whenever two
      // activities are built in the same tick — and a post fan-out plus a delete
      // for the same post is exactly that case. Activity ids must be globally
      // unique because peers key their dedup and their reply threading off them.
      id: `${this.instanceBaseUrl}/federation/activities/${randomUUID()}`,
      type,
      actor: `${this.instanceBaseUrl}/federation/users/${actorUsername}`,
      to: overrides.to ?? ['https://www.w3.org/ns/activitystreams#Public'],
      cc: overrides.cc ?? [
        `${this.instanceBaseUrl}/federation/users/${actorUsername}/followers`,
      ],
      object,
      published: new Date().toISOString(),
    };
  }

  private async getLocalActorUsername(userId: string): Promise<string | null> {
    const user = await this.userService.findOneById(userId);
    return user?.username || null;
  }

  async deliverToInbox(
    instance: Partial<RemoteInstance>,
    activity: any,
    options: {
      maxAttempts?: number;
      retryDelayMs?: number;
      actorUsername?: string;
      /** Target a specific actor's inbox rather than the instance shared inbox. */
      inboxUrl?: string;
    } = {},
  ) {
    const inboxUrl = options.inboxUrl || (instance?.baseUrl ? `${instance.baseUrl}/inbox` : '');
    if (!inboxUrl) {
      return { delivered: false, skipped: true, reason: 'instance has no baseUrl' } as DeliveryResult;
    }

    const maxAttempts = options.maxAttempts ?? this.defaultDeliveryRetries;
    const actorUsername = options.actorUsername || 'local';
    const actorUrl = `${this.instanceBaseUrl}/federation/users/${actorUsername}`;
    let lastError: unknown;

    const body = JSON.stringify(activity);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        // Signed inside the loop, not once before it. `signRequest` stamps a
        // `Date` header, and a peer that enforces clock skew will start
        // rejecting a signature computed before a slow backoff — so a retry
        // that reused the original headers could fail *because* it retried.
        const signedHeaders = this.httpSignaturesService.getSignedPostHeaders(
          actorUrl,
          body,
          inboxUrl,
        );

        await axios.post(inboxUrl, body, {
          headers: signedHeaders,
          timeout: 10000,
        });
        return { delivered: true, attempts: attempt } as DeliveryResult;
      } catch (error) {
        lastError = error;
        const axiosError = error as any;
        const status = axiosError?.response?.status;

        if (status === 401 || status === 403) {
          // A rejected signature is deterministic. Retrying the identical
          // bytes three times just triples the load on a peer that will refuse
          // every attempt, so stop immediately.
          this.logger.warn(
            `HTTP Signature rejected by ${inboxUrl} (${status}) — not retrying; check actor keyId alignment`,
          );
          return {
            delivered: false,
            attempts: attempt,
            status,
            reason: `signature rejected (${status})`,
            retryable: false,
          } as DeliveryResult;
        }

        // 4xx other than 408/429 means the request itself is bad, so it will
        // stay bad. Retrying it cannot succeed.
        if (typeof status === 'number' && status >= 400 && status < 500 && status !== 429) {
          this.logger.warn(
            `Delivery to ${inboxUrl} rejected with ${status} — not retrying`,
          );
          return {
            delivered: false,
            attempts: attempt,
            status,
            reason: `rejected with ${status}`,
            retryable: false,
          } as DeliveryResult;
        }

        if (attempt < maxAttempts) {
          // Exponential backoff, capped, rather than a flat 200ms. A peer that
          // is down should not receive three requests inside 400ms.
          const base = options.retryDelayMs ?? this.defaultDeliveryRetryDelayMs;
          const delay = Math.min(base * 2 ** (attempt - 1), this.maxDeliveryRetryDelayMs);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async probeInteroperability(domain: string) {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${normalizedDomain}`;

    const result = {
      domain: normalizedDomain,
      compatible: false,
      software: null as string | null,
      version: null as string | null,
      capabilities: [] as string[],
      errors: [] as string[],
    };

    try {
      const nodeInfoResponse = await axios.get(`${baseUrl}/.well-known/nodeinfo`, { timeout: 5000 });
      const nodeInfoLinks = nodeInfoResponse.data?.links || [];
      const nodeInfoUrl =
        nodeInfoLinks.find((link: any) => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0')?.href ||
        `${baseUrl}/nodeinfo/2.0`;

      const nodeInfoResponseData = await axios.get(nodeInfoUrl, { timeout: 5000 });
      result.software = nodeInfoResponseData.data?.software?.name || null;
      result.version = nodeInfoResponseData.data?.software?.version || null;
      result.capabilities = ['inbox', 'outbox', 'nodeinfo'];

      try {
        await axios.get(`${baseUrl}/.well-known/webfinger?resource=acct:local@${normalizedDomain}`, { timeout: 5000 });
        result.capabilities.push('webfinger');
      } catch {
        result.errors.push('webfinger-unavailable');
      }

      result.compatible = true;
      return {
        ...result,
        testedAt: new Date().toISOString(),
        endpoint: `https://${normalizedDomain}`,
      };
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'interoperability-check-failed');
      return result;
    }
  }

  async blockInstance(instanceId: string): Promise<void> {
    await this.instanceRepository.update(instanceId, { isBlocked: true });
  }

  async unblockInstance(instanceId: string): Promise<void> {
    await this.instanceRepository.update(instanceId, { isBlocked: false });
  }

  // ---- Per-user moderation across servers --------------------------------

  private async getModerationRow(
    localUserId: string,
    remoteUserId: string,
  ): Promise<FederationModeration> {
    const remoteUser = await this.remoteUserRepository.findOne({
      where: { id: remoteUserId },
    });
    if (!remoteUser) {
      throw new HttpException('Remote user not found', HttpStatus.NOT_FOUND);
    }
    let row = await this.moderationRepository.findOne({
      where: {
        localUser: { id: localUserId } as any,
        remoteUser: { id: remoteUserId } as any,
      },
    });
    if (!row) {
      row = this.moderationRepository.create({
        localUser: { id: localUserId } as any,
        remoteUser: { id: remoteUserId } as any,
      });
    }
    return row;
  }

  async blockRemoteUser(localUserId: string, remoteUserId: string): Promise<void> {
    const row = await this.getModerationRow(localUserId, remoteUserId);
    row.isBlocked = true;
    await this.moderationRepository.save(row);
  }

  async unblockRemoteUser(localUserId: string, remoteUserId: string): Promise<void> {
    const row = await this.getModerationRow(localUserId, remoteUserId);
    row.isBlocked = false;
    await this.moderationRepository.save(row);
  }

  async muteRemoteUser(localUserId: string, remoteUserId: string): Promise<void> {
    const row = await this.getModerationRow(localUserId, remoteUserId);
    row.isMuted = true;
    await this.moderationRepository.save(row);
  }

  async unmuteRemoteUser(localUserId: string, remoteUserId: string): Promise<void> {
    const row = await this.getModerationRow(localUserId, remoteUserId);
    row.isMuted = false;
    await this.moderationRepository.save(row);
  }

  async getRemoteModerations(localUserId: string) {
    return this.moderationRepository.find({
      where: { localUser: { id: localUserId } as any },
      relations: ['remoteUser'],
      order: { updatedAt: 'DESC' },
    });
  }

  // ---- Inbound follow relationships ---------------------------------------

  /** Accept either a full actor URL or a bare username as the Follow target. */
  private extractLocalUsername(targetActorUrl: string | undefined): string | null {
    if (!targetActorUrl || typeof targetActorUrl !== 'string') return null;
    const prefix = `${this.instanceBaseUrl}/federation/users/`;
    if (targetActorUrl.startsWith(prefix)) {
      return targetActorUrl.slice(prefix.length).split(/[/?#]/)[0] || null;
    }
    // A bare username, but only if it is a plausible one (no URL syntax).
    if (!targetActorUrl.includes('/') && !targetActorUrl.includes(':')) {
      return targetActorUrl || null;
    }
    return null;
  }

  private async recordInboundFollow(
    remoteUser: RemoteUser,
    localUser: User,
    activity: any,
  ): Promise<void> {
    try {
      const existing = await this.followRepository.findOne({
        where: { localUser: { id: localUser.id } as any, remoteUser: { id: remoteUser.id } as any },
      });

      // Idempotent: Mastodon re-sends a Follow on reconnect, and the pair is
      // already unique, so a blind save would throw a constraint violation.
      if (existing) {
        existing.followActivityId = activity.id ?? null;
        await this.followRepository.save(existing);
        return;
      }

      await this.followRepository.save(
        this.followRepository.create({
          localUser: { id: localUser.id } as any,
          remoteUser: { id: remoteUser.id } as any,
          followActivityId: activity.id ?? null,
        }),
      );
    } catch (error) {
      // Never fail the inbox on a bookkeeping write — the Accept still goes out.
      this.logger.error(
        `Failed to record inbound follow ${remoteUser.actorId} -> ${localUser.username}`,
        error,
      );
    }
  }

  private async removeInboundFollow(
    actorUrl: string | undefined,
    targetActorUrl: string | undefined,
  ): Promise<boolean> {
    if (!actorUrl || !targetActorUrl) return false;

    const localUsername = this.extractLocalUsername(targetActorUrl);
    if (!localUsername) return false;

    try {
      const [localUser, remoteUser] = await Promise.all([
        this.userService.findByUsername(localUsername, []),
        this.findRemoteUserByActorId(actorUrl),
      ]);
      if (!localUser || !remoteUser) return false;

      const existing = await this.followRepository.findOne({
        where: { localUser: { id: localUser.id } as any, remoteUser: { id: remoteUser.id } as any },
      });
      if (!existing) return false;

      await this.followRepository.remove(existing);
      return true;
    } catch (error) {
      this.logger.error(`Failed to process follow undo from ${actorUrl}`, error);
      return false;
    }
  }

  private async findRemoteUserByActorId(actorId: string): Promise<RemoteUser | null> {
    const found = await this.remoteUserRepository.findOne({ where: { actorId } });
    return found ?? null;
  }

  /** Inbound federated followers of a local user, for admin/visibility use. */
  /**
   * Load a post for re-federation, scoped to its author.
   *
   * The author check is not optional: a re-drive endpoint that accepted any post
   * id would let an authenticated caller push someone else's post to their own
   * followers under their own name.
   */
  async getLocalPostForFederation(
    postId: string,
    authorId: string,
  ): Promise<{ id: string; content: string; createdAt?: Date } | null> {
    const post = await this.postsService
      .findPostsByUserId(authorId)
      .then((posts) => posts.find((candidate: any) => String(candidate.id) === String(postId)));

    if (!post) return null;
    if (post.isDraft || post.isEncrypted || post.isAnonymous) return null;

    return { id: post.id, content: post.content, createdAt: post.createdAt };
  }

  /**
   * Distinct domains of the remote actors that follow this local user.
   *
   * This is the delivery fan-out list for a new post. Deduplicated because a
   * user with 40 followers on one Mastodon instance must produce one delivery,
   * not 40 — and because `federated_instances` is one row per domain, a query
   * over the join would otherwise fan out per-follower.
   */
  async getFollowerInstanceDomains(localUserId: string): Promise<string[]> {
    try {
      const follows = await this.followRepository.find({
        where: { localUser: { id: localUserId } as any },
        relations: ['remoteUser'],
      });

      const domains = new Set<string>();
      for (const follow of follows) {
        const domain = follow.remoteUser?.instance?.domain;
        if (domain) domains.add(domain);
      }
      return [...domains];
    } catch (error) {
      this.logger.warn(
        `Unable to resolve follower instance domains for ${localUserId}`,
        error,
      );
      return [];
    }
  }

  /**
   * A read model over remote posts, for display.
   *
   * Inbound `Create`/`Announce` rows in `federated_posts` were previously stored
   * and then never rendered: nothing projected them into anything a user could
   * read. So a remote user could follow, the follow was recorded, the followers
   * collection showed it — and their posts remained invisible. That makes the
   * whole follow graph pointless.
   *
   * This is deliberately a *separate* read model rather than a synthetic local
   * `Post` row per remote status. Writing remote content into the `posts` table
   * would mean inventing a `User` for actors who have no local account, which
   * corrupts follower counts, mention resolution, and moderation for every
   * account on the instance. Real implementations add a `uri` column to the
   * statuses table instead; that is a schema migration and a much larger change,
   * so it is left as an explicit follow-up rather than faked here.
   */
  async getFederatedTimeline(
    viewerId: string | null,
    options: { limit?: number; offset?: number; includeMuted?: boolean } = {},
  ): Promise<{
    items: FederatedTimelineItem[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const offset = Math.max(options.offset ?? 0, 0);

    // Rows written by `federatePost` to record outbound activity ids have no
    // author and no instance. They are bookkeeping, not content, and must never
    // surface as posts.
    const query = this.remotePostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.instance', 'instance')
      .where('author.id IS NOT NULL')
      .andWhere('instance.id IS NOT NULL')
      .orderBy('post.publishedAt', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();

    const allowed = await this.filterVisibleRemotePosts(viewerId, posts, options.includeMuted ?? false);

    return {
      items: allowed.map((post) => this.toTimelineItem(post)),
      // `total` counts every stored post; `items` may be fewer once blocked and
      // muted rows are removed. Reporting the unfiltered total as though it
      // matched the page length would make `hasMore` lie.
      total,
      limit,
      offset,
      hasMore: offset + allowed.length < total,
    };
  }

  /**
   * Drop remote posts the viewer has blocked or muted, and any originating from
   * a blocked instance.
   *
   * Failing open here would be a moderation bypass: a user who blocked a remote
   * account would still see its posts in the federated timeline, which is the
   * one surface a block most obviously has to cover.
   */
  private async filterVisibleRemotePosts(
    viewerId: string | null,
    posts: RemotePost[],
    includeMuted: boolean,
  ): Promise<RemotePost[]> {
    if (!viewerId) return posts;

    try {
      const [moderations, blockedInstances] = await Promise.all([
        this.moderationRepository.find({
          where: { localUser: { id: viewerId } as any },
        }),
        this.instanceRepository.find({ where: { isBlocked: true } }),
      ]);

      const blockedUserIds = new Set(
        moderations.filter((m) => m.isBlocked).map((m) => m.remoteUser?.id),
      );
      const mutedUserIds = new Set(
        moderations.filter((m) => m.isMuted).map((m) => m.remoteUser?.id),
      );
      const blockedDomains = new Set(
        blockedInstances.map((instance) => instance.domain),
      );

      return posts.filter((post) => {
        if (post.author && blockedUserIds.has(post.author.id)) return false;
        if (!includeMuted && post.author && mutedUserIds.has(post.author.id)) return false;
        if (post.instance && blockedDomains.has(post.instance.domain)) return false;
        return true;
      });
    } catch (error) {
      // Fail *closed* on a moderation lookup error. Returning unfiltered posts
      // here would show a user content from accounts and instances they blocked.
      this.logger.error(
        `Unable to apply federated moderation filters for viewer ${viewerId}; returning no remote posts`,
        error,
      );
      return [];
    }
  }

  private toTimelineItem(post: RemotePost): FederatedTimelineItem {
    return {
      id: post.activityId,
      content: post.content,
      publishedAt: post.publishedAt,
      inReplyToId: post.inReplyToId ?? null,
      mediaUrls: post.mediaUrls ?? [],
      mentions: post.mentions ?? [],
      tags: post.tags ?? [],
      likeCount: post.likeCount ?? 0,
      shareCount: post.shareCount ?? 0,
      isFederated: true,
      author: post.author
        ? {
            actorId: post.author.actorId,
            username: post.author.username,
            name: post.author.name ?? null,
            avatarUrl: post.author.avatarUrl ?? null,
          }
        : null,
      instance: post.instance
        ? {
            domain: post.instance.domain,
            baseUrl: post.instance.baseUrl,
            software: post.instance.software ?? null,
          }
        : null,
    };
  }

  async getInboundFollowers(localUserId: string): Promise<FederationFollow[]> {
    return this.followRepository.find({
      where: { localUser: { id: localUserId } as any },
      relations: ['remoteUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async countInboundFollowers(localUserId: string): Promise<number> {
    return this.followRepository.count({ where: { localUser: { id: localUserId } as any } });
  }

  // Cross-server reply chains: fetch the direct replies to a remote post.
  async getRemoteReplies(postActivityId: string): Promise<RemotePost[]> {
    return this.remotePostRepository.find({
      where: { inReplyToId: postActivityId },
      order: { publishedAt: 'ASC' },
    });
  }

  async getInstanceFederationStats() {
    const totalInstances = await this.instanceRepository.count();
    const activeInstances = await this.instanceRepository.count({ where: { isBlocked: false } });
    const totalRemoteUsers = await this.remoteUserRepository.count();
    const totalRemotePosts = await this.remotePostRepository.count();

    return {
      totalInstances,
      activeInstances,
      totalRemoteUsers,
      totalRemotePosts,
      localDomain: this.instanceDomain,
      localBaseUrl: this.instanceBaseUrl,
      federationEnabled: this.federationEnabled,
    };
  }

  async getLocalActor(username: string) {
    const user = await this.userService.findByUsername(username, ['followers', 'following']);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
      ],
      id: `${this.instanceBaseUrl}/federation/users/${username}`,
      type: 'Person',
      preferredUsername: username,
      name: user.displayName || user.username,
      summary: user.bio || '',
      icon: {
        type: 'Image',
        url: user.avatar
          ? `${this.instanceBaseUrl}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`
          : `${this.instanceBaseUrl}/default-avatar.png`,
      },
      inbox: `${this.instanceBaseUrl}/federation/users/${username}/inbox`,
      outbox: `${this.instanceBaseUrl}/federation/users/${username}/outbox`,
      followers: `${this.instanceBaseUrl}/federation/users/${username}/followers`,
      following: `${this.instanceBaseUrl}/federation/users/${username}/following`,
      publicKey: {
        id: `${this.instanceBaseUrl}/federation/users/${username}#main-key`,
        owner: `${this.instanceBaseUrl}/federation/users/${username}`,
        publicKeyPem: this.httpSignaturesService.getPublicKeyPem(),
      },
    };
  }

  /**
   * The followers Collection a remote server reads to resolve a follow.
   *
   * This previously listed only *local* followers, so a Mastodon user that had
   * followed someone here never appeared in the collection that defines the
   * relationship — the reverse direction of the very follow we accept. Both are
   * merged now, which is what makes the round trip actually work: remote follows
   * this user, and the remote server can verify the relationship by reading it
   * back.
   */
  async getLocalFollowers(username: string) {
    const user = await this.userService.findByUsername(username, ['followers']);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const localFollowers = user.followers || [];
    const remoteFollowers = await this.getInboundFollowers(user.id).catch((error) => {
      this.logger.warn(`Unable to load federated followers for ${username}`, error);
      return [] as FederationFollow[];
    });

    const items = [
      ...localFollowers.map((follower) => ({
        id: `${this.instanceBaseUrl}/federation/users/${follower.username}`,
        type: 'Person',
        preferredUsername: follower.username,
      })),
      ...remoteFollowers
        .filter((follow) => follow.remoteUser?.actorId)
        .map((follow) => ({
          id: follow.remoteUser.actorId,
          type: 'Person',
          preferredUsername: follow.remoteUser.username,
        })),
    ];

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/federation/users/${username}/followers`,
      type: 'Collection',
      // Deduplicated: a remote actor is listed once even if a replayed Follow
      // created a second row, and the total must match the items actually sent.
      totalItems: items.length,
      items,
    };
  }

  async getLocalFollowing(username: string) {
    const user = await this.userService.findByUsername(username, ['following']);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/federation/users/${username}/following`,
      type: 'Collection',
      totalItems: user.following?.length || 0,
      items: (user.following || []).map((following) => ({
        id: `${this.instanceBaseUrl}/federation/users/${following.username}`,
        type: 'Person',
        preferredUsername: following.username,
      })),
    };
  }

  async getLocalOutbox(username: string) {
    const user = await this.userService.findByUsername(username, []);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const posts = await this.postsService.findPostsByUserId(user.id);
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/federation/users/${username}/outbox`,
      type: 'OrderedCollection',
      totalItems: posts.length,
      orderedItems: posts.map((post) => ({
        id: `${this.instanceBaseUrl}/federation/activities/${encodeURIComponent(post.id)}`,
        type: 'Create',
        actor: `${this.instanceBaseUrl}/federation/users/${username}`,
        object: {
          id: `${this.instanceBaseUrl}/posts/${post.id}`,
          type: 'Note',
          content: post.content || '',
          published: post.createdAt.toISOString(),
          attributedTo: `${this.instanceBaseUrl}/federation/users/${username}`,
          to: ['https://www.w3.org/ns/activitystreams#Public'],
        },
      })),
    };
  }

  async processSharedInbox(activity: any) {
    this.logger.log('Received ActivityPub activity:', JSON.stringify(activity));

    if (!activity?.type) {
      return { success: false, received: false, reason: 'Missing activity type' };
    }

    if (activity.type === 'Follow') {
      const actorUrl = activity.actor;
      const targetActorUrl = activity.object;
      let remoteActor = null;
      let localUser: any = null;

      if (actorUrl) {
        try {
          remoteActor = await this.fetchRemoteUser(actorUrl);
        } catch (error) {
          this.logger.warn(`Unable to fetch remote actor ${actorUrl} for follow acceptance`, error);
        }
      }

      // Resolve the local account being followed. `activity.object` is normally
      // the full actor URL; some implementations send a bare username, so both
      // are handled.
      const localUsername = this.extractLocalUsername(targetActorUrl);
      if (localUsername) {
        try {
          localUser = await this.userService.findByUsername(localUsername, []);
        } catch (error) {
          this.logger.warn(`Unable to resolve local actor ${targetActorUrl}`, error);
        }
      }

      // Persist the follow *before* replying Accept. Previously the Accept was
      // sent and then the relationship was dropped on the floor, so the remote
      // server was told the follow existed while this instance held no record of
      // it — it never appeared in the followers collection, and Undo had nothing
      // to remove.
      if (remoteActor && localUser) {
        await this.recordInboundFollow(remoteActor, localUser, activity);
      } else if (!localUser) {
        this.logger.warn(
          `Follow for unknown local actor ${targetActorUrl} — accepted but not recorded`,
        );
      }

      const inboxUrl = remoteActor?.inboxUrl || (actorUrl ? `${new URL(actorUrl).origin}/inbox` : null);

      const acceptActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: `${this.instanceBaseUrl}/federation/accepts/${Date.now()}`,
        type: 'Accept',
        actor: targetActorUrl || `${this.instanceBaseUrl}/federation/users/local`,
        object: activity,
        to: [actorUrl],
      };

      if (inboxUrl && this.federationEnabled) {
        try {
          const body = JSON.stringify(acceptActivity);
          const signedHeaders = this.httpSignaturesService.getSignedPostHeaders(
            `${this.instanceBaseUrl}/federation/users/local`,
            body,
            inboxUrl,
          );
          await axios.post(inboxUrl, body, { headers: signedHeaders });
        } catch (error) {
          this.logger.error(`Failed to send Accept for follow from ${actorUrl}:`, error);
        }
      } else if (inboxUrl) {
        await axios.post(inboxUrl, acceptActivity, {
          headers: { 'Content-Type': 'application/activity+json' },
        });
      }

      return { success: true, received: true, type: activity.type, accepted: true };
    }

    if (activity.type === 'Create') {
      return this.handleCreateActivity(activity);
    }

    if (activity.type === 'Like') {
      const object = activity.object || {};
      const targetId = typeof object === 'string' ? object : object.id;
      if (targetId) {
        const existingPost = await this.remotePostRepository.findOne({ where: { activityId: targetId } as any });
        if (existingPost) {
          existingPost.likeCount = (existingPost.likeCount || 0) + 1;
          await this.remotePostRepository.save(existingPost);
        }
      }
      return { success: true, received: true, type: activity.type, status: 'like-recorded' };
    }

    if (activity.type === 'Announce') {
      const object = activity.object || {};
      const targetId = typeof object === 'string' ? object : object.id;
      if (targetId) {
        const existingPost = await this.remotePostRepository.findOne({ where: { activityId: targetId } as any });
        if (existingPost) {
          existingPost.shareCount = (existingPost.shareCount || 0) + 1;
          await this.remotePostRepository.save(existingPost);
        }
      }
      return { success: true, received: true, type: activity.type, status: 'announce-recorded' };
    }

    if (activity.type === 'Delete') {
      const object = activity.object || {};
      const targetId = typeof object === 'string' ? object : object.id;
      if (targetId) {
        const existingPost = await this.remotePostRepository.findOne({ where: { activityId: targetId } as any });
        if (existingPost) {
          await this.remotePostRepository.remove(existingPost);
        }
      }
      return { success: true, received: true, type: activity.type, status: 'delete-processed' };
    }

    if (activity.type === 'Update') {
      const object = activity.object || {};
      const targetId = typeof object === 'string' ? object : object.id;
      if (targetId) {
        const existingPost = await this.remotePostRepository.findOne({ where: { activityId: targetId } as any });
        if (existingPost) {
          existingPost.content = object.content || object.summary || existingPost.content;
          await this.remotePostRepository.save(existingPost);
        }
      }
      return { success: true, received: true, type: activity.type, status: 'update-processed' };
    }

    if (activity.type === 'Undo') {
      const object = activity.object || {};
      if (object.type === 'Follow') {
        // Previously returned `follow-undo-processed` without touching the
        // database, so a remote user who unfollowed stayed a follower forever.
        const removed = await this.removeInboundFollow(
          object.actor || activity.actor,
          object.object,
        );
        return {
          success: true,
          received: true,
          type: activity.type,
          status: removed ? 'follow-undo-processed' : 'follow-undo-noop',
        };
      }
      return { success: true, received: true, type: activity.type, status: 'undo-processed' };
    }

    return { success: true, received: true, type: activity.type };
  }

  private async handleCreateActivity(activity: any) {
    const object = activity.object || {};
    const actorUrl = activity.actor;
    let author = null;
    let instance = null;

    if (actorUrl) {
      try {
        author = await this.fetchRemoteUser(actorUrl);
        instance = author?.instance;
      } catch (error) {
        this.logger.warn(`Unable to fetch remote author ${actorUrl}; continuing with minimal persistence`, error);
      }
    }

    if (!instance && actorUrl) {
      instance = await this.getOrCreateInstanceFromActor(actorUrl);
    }

    const persistedPost = await this.remotePostRepository.save(
      this.remotePostRepository.create({
        activityId: object.id || `${activity.id || Date.now()}`,
        activityType: ActivityType.CREATE,
        content: object.content || object.summary || '',
        inReplyToId: object.inReplyTo,
        author,
        instance,
        mediaUrls: object.attachment?.map((attachment: any) => attachment.url),
        mentions: object.tag?.filter((tag: any) => tag.type === 'Mention').map((tag: any) => tag.href),
        tags: object.tag?.filter((tag: any) => tag.type === 'Hashtag').map((tag: any) => tag.name),
        publishedAt: object.published ? new Date(object.published) : new Date(),
      }),
    );

    return { success: true, received: true, type: activity.type, persistedPostId: persistedPost.id };
  }

  async processUserInbox(username: string, activity: any) {
    this.logger.log(`Received activity in ${username}'s inbox:`, JSON.stringify(activity));
    return this.processSharedInbox(activity);
  }

  private async getOrCreateInstanceFromActor(actorUrl: string): Promise<RemoteInstance | null> {
    try {
      const actorDomain = new URL(actorUrl).hostname;
      const existingInstance = await this.instanceRepository.findOne({ where: { domain: actorDomain } });
      if (existingInstance) {
        return existingInstance;
      }

      const discovered = await this.discoverInstance(actorDomain);
      const instance = this.instanceRepository.create({
        ...discovered,
        lastSyncAt: new Date(),
      });
      return this.instanceRepository.save(instance);
    } catch (error) {
      this.logger.warn(`Unable to discover remote instance for actor ${actorUrl}:`, error);
      return null;
    }
  }

  async webfinger(acct: string) {
    const [username, domain] = acct.replace('acct:', '').split('@');

    if (domain === this.instanceDomain) {
      return {
        subject: `acct:${username}@${domain}`,
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: `${this.instanceBaseUrl}/federation/users/${username}`,
          },
        ],
      };
    }

    const instance = await this.instanceRepository.findOne({ where: { domain } });
    if (!instance) {
      throw new HttpException('Remote instance not found', HttpStatus.NOT_FOUND);
    }

    try {
      const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`;
      const response = await axios.get(webfingerUrl);
      return response.data;
    } catch (error) {
      this.logger.error(`Webfinger lookup failed for ${acct}:`, error);
      throw new HttpException('Webfinger lookup failed', HttpStatus.BAD_REQUEST);
    }
  }
}
