import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost, ActivityType } from './entities/remote-post.entity';
import { ConnectInstanceDto, RemoteInstanceDto } from './dto/remote-instance.dto';
import { FederatePostDto, FederateFollowDto } from './dto/federate-post.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FederationService {
  private readonly logger = new Logger(FederationService.name);
  private readonly instanceDomain: string;
  private readonly instanceBaseUrl: string;

  constructor(
    @InjectRepository(RemoteInstance)
    private readonly instanceRepository: Repository<RemoteInstance>,
    @InjectRepository(RemoteUser)
    private readonly remoteUserRepository: Repository<RemoteUser>,
    @InjectRepository(RemotePost)
    private readonly remotePostRepository: Repository<RemotePost>,
    private readonly configService: ConfigService,
  ) {
    this.instanceDomain = this.configService.get<string>('INSTANCE_DOMAIN', 'zynkra.local');
    this.instanceBaseUrl = this.configService.get<string>('INSTANCE_BASE_URL', 'https://zynkra.local');
  }

  async getConnectedInstances(): Promise<RemoteInstance[]> {
    return this.instanceRepository.find({
      where: { isBlocked: false },
      relations: ['remoteUsers'],
    });
  }

  async discoverInstance(domain: string): Promise<RemoteInstanceDto> {
    try {
      const wellKnownUrl = `https://${domain}/.well-known/nodeinfo`;
      const nodeInfoResponse = await axios.get(wellKnownUrl);
      
      let nodeInfoUrl = nodeInfoResponse.data.links?.find(
        (link: any) => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0'
      )?.href;

      if (!nodeInfoUrl) {
        nodeInfoUrl = `https://${domain}/nodeinfo/2.0`;
      }

      const nodeInfo = await axios.get(nodeInfoUrl);
      
      return {
        domain,
        name: nodeInfo.data?.metadata?.nodeName || domain,
        description: nodeInfo.data?.metadata?.nodeDescription || '',
        baseUrl: `https://${domain}`,
        software: nodeInfo.data?.software?.name,
        version: nodeInfo.data?.software?.version,
        isVerified: true,
      };
    } catch (error) {
      this.logger.error(`Failed to discover instance ${domain}:`, error);
      throw new HttpException(
        `Could not discover instance at ${domain}. Verify it's a valid ActivityPub compatible server.`,
        HttpStatus.BAD_REQUEST
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

    const instanceInfo = await this.discoverInstance(connectDto.domain);
    
    const instance = this.instanceRepository.create({
      ...instanceInfo,
      lastSyncAt: new Date(),
    });

    return this.instanceRepository.save(instance);
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
      const actorResponse = await axios.get(actorId, {
        headers: { Accept: 'application/activity+json' },
      });
      const actor = actorResponse.data;

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
      const postResponse = await axios.get(activityId, {
        headers: { Accept: 'application/activity+json' },
      });
      const activity = postResponse.data;

      const author = await this.fetchRemoteUser(activity.actor);
      const domain = new URL(activityId).hostname;
      const instance = await this.instanceRepository.findOne({ where: { domain } });

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
    const activity = this.buildActivity('Create', localUserId, {
      ...federateDto,
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
    const targetUser = await this.fetchRemoteUser(followDto.objectId);
    if (!targetUser?.inboxUrl) {
      throw new HttpException('Cannot follow this user: no inbox URL found', HttpStatus.BAD_REQUEST);
    }

    const followActivity = this.buildActivity('Follow', localUserId, {
      object: followDto.objectId,
    });

    try {
      await axios.post(targetUser.inboxUrl, followActivity, {
        headers: {
          'Content-Type': 'application/activity+json',
          'Host': new URL(targetUser.inboxUrl).hostname,
        },
      });
      this.logger.log(`Follow sent to ${targetUser.username}@${targetUser.instance.domain}`);
      return { success: true, message: `Following ${targetUser.username}@${targetUser.instance.domain}` };
    } catch (error) {
      this.logger.error('Failed to send follow:', error);
      throw new HttpException('Failed to follow remote user', HttpStatus.BAD_REQUEST);
    }
  }

  private buildActivity(type: string, actorId: string, object: any) {
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.instanceBaseUrl}/activities/${Date.now()}`,
      type,
      actor: `${this.instanceBaseUrl}/users/${actorId}`,
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [`${this.instanceBaseUrl}/users/${actorId}/followers`],
      object,
      published: new Date().toISOString(),
    };
  }

  private async deliverToInbox(instance: RemoteInstance, activity: any) {
    if (!instance.baseUrl) return;

    const inboxUrl = `${instance.baseUrl}/inbox`;
    await axios.post(inboxUrl, activity, {
      headers: {
        'Content-Type': 'application/activity+json',
        'Host': new URL(inboxUrl).hostname,
      },
    });
  }

  async blockInstance(instanceId: string): Promise<void> {
    await this.instanceRepository.update(instanceId, { isBlocked: true });
  }

  async unblockInstance(instanceId: string): Promise<void> {
    await this.instanceRepository.update(instanceId, { isBlocked: false });
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
    };
  }

  async webfinger(acct: string) {
    const [username, domain] = acct.replace('acct:', '').split('@');
    
    if (domain === this.instanceDomain) {
      return {
        subject: `acct:${username}@${domain}`,
        links: [{
          rel: 'self',
          type: 'application/activity+json',
          href: `${this.instanceBaseUrl}/users/${username}`,
        }],
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