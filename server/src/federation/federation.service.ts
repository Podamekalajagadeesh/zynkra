import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost, ActivityType } from './entities/remote-post.entity';
import { FederationModeration } from './entities/federation-moderation.entity';
import { ConnectInstanceDto, RemoteInstanceDto } from './dto/remote-instance.dto';
import { FederatePostDto, FederateFollowDto } from './dto/federate-post.dto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { HttpSignaturesService } from './http-signatures.service';
import axios from 'axios';

@Injectable()
export class FederationService implements OnModuleInit {
  private readonly logger = new Logger(FederationService.name);
  private readonly instanceDomain: string;
  private readonly instanceBaseUrl: string;
  private readonly federationEnabled: boolean;
  private readonly defaultDeliveryRetries = 3;
  private readonly defaultDeliveryRetryDelayMs = 200;

  constructor(
    @InjectRepository(RemoteInstance)
    private readonly instanceRepository: Repository<RemoteInstance>,
    @InjectRepository(RemoteUser)
    private readonly remoteUserRepository: Repository<RemoteUser>,
    @InjectRepository(RemotePost)
    private readonly remotePostRepository: Repository<RemotePost>,
    @InjectRepository(FederationModeration)
    private readonly moderationRepository: Repository<FederationModeration>,
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

  async federatePost(localUserId: string, federateDto: FederatePostDto, targetInstances: string[]) {
    this.assertFederationEnabled();

    const activity = await this.buildActivity('Create', localUserId, {
      ...federateDto,
      type: 'Note',
      content: federateDto.content,
      published: federateDto.publishedAt?.toISOString?.() || new Date().toISOString(),
      to: federateDto.to || ['https://www.w3.org/ns/activitystreams#Public'],
      cc: federateDto.cc || [],
    });

    for (const instanceDomain of targetInstances) {
      const instance = await this.instanceRepository.findOne({
        where: { domain: instanceDomain, isBlocked: false },
      });

      if (!instance) continue;

      try {
        await this.deliverToInbox(instance, activity);
        this.logger.log(`Successfully federated post to ${instanceDomain}`);
      } catch (error) {
        this.logger.error(`Failed to federate post to ${instanceDomain}:`, error);
      }
    }
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

    try {
      const body = JSON.stringify(followActivity);
      const actorUsername = (await this.getLocalActorUsername(localUserId)) || 'local';
      const actorUrl = `${this.instanceBaseUrl}/federation/users/${actorUsername}`;
      const signedHeaders = this.httpSignaturesService.getSignedPostHeaders(
        actorUrl,
        body,
        targetUser.inboxUrl,
      );

      await axios.post(targetUser.inboxUrl, body, {
        headers: signedHeaders,
      });
      this.logger.log(`Follow sent to ${targetUser.username}@${targetUser.instance.domain}`);
      return { success: true, message: `Following ${targetUser.username}@${targetUser.instance.domain}` };
    } catch (error) {
      this.logger.error('Failed to send follow:', error);
      throw new HttpException('Failed to follow remote user', HttpStatus.BAD_REQUEST);
    }
  }

  private async buildActivity(type: string, localUserId: string, object: any) {
    const user = await this.userService.findOneById(localUserId);
    const actorUsername = user?.username || localUserId;

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/federation/activities/${Date.now()}`,
      type,
      actor: `${this.instanceBaseUrl}/federation/users/${actorUsername}`,
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [`${this.instanceBaseUrl}/federation/users/${actorUsername}/followers`],
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
    options: { maxAttempts?: number; retryDelayMs?: number; actorUsername?: string } = {},
  ) {
    if (!instance?.baseUrl) return;

    const inboxUrl = `${instance.baseUrl}/inbox`;
    const maxAttempts = options.maxAttempts ?? this.defaultDeliveryRetries;
    const actorUsername = options.actorUsername || 'local';
    const actorUrl = `${this.instanceBaseUrl}/federation/users/${actorUsername}`;
    let lastError: unknown;

    const body = JSON.stringify(activity);
    const signedHeaders = this.httpSignaturesService.getSignedPostHeaders(
      actorUrl,
      body,
      inboxUrl,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await axios.post(inboxUrl, body, {
          headers: signedHeaders,
          timeout: 10000,
        });
        return;
      } catch (error) {
        lastError = error;
        const axiosError = error as any;
        if (axiosError?.response?.status === 401) {
          this.logger.warn(`HTTP Signature rejected by ${instance.baseUrl} — check actor keyId alignment`);
        }
        if (attempt < maxAttempts) {
          const delay = options.retryDelayMs ?? this.defaultDeliveryRetryDelayMs;
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

  async getLocalFollowers(username: string) {
    const user = await this.userService.findByUsername(username, ['followers']);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/federation/users/${username}/followers`,
      type: 'Collection',
      totalItems: user.followers?.length || 0,
      items: (user.followers || []).map((follower) => ({
        id: `${this.instanceBaseUrl}/federation/users/${follower.username}`,
        type: 'Person',
        preferredUsername: follower.username,
      })),
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

      if (actorUrl) {
        try {
          remoteActor = await this.fetchRemoteUser(actorUrl);
        } catch (error) {
          this.logger.warn(`Unable to fetch remote actor ${actorUrl} for follow acceptance`, error);
        }
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
        return { success: true, received: true, type: activity.type, status: 'follow-undo-processed' };
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
