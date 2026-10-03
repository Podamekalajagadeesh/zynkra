import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { FederationService } from './federation.service';
import { HttpSignaturesService } from './http-signatures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// Canonical path. `auth/guards/optional-jwt-auth.guard.ts` re-exports this, so
// both import paths resolve to one implementation — two classes with the same
// name and different `handleRequest` behavior would be registered separately by
// Nest, and a controller could silently pick up the wrong one.
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/roles.enum';
import { ConnectInstanceDto } from './dto/remote-instance.dto';
import { FederateFollowDto, FederatePostRequestDto, FederateRemoteObjectDto } from './dto/federate-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('federation')
export class FederationController {
  constructor(
    private readonly federationService: FederationService,
    private readonly httpSignaturesService: HttpSignaturesService,
  ) {}

  @Get('instances')
  @UseGuards(JwtAuthGuard)
  async getInstances() {
    return this.federationService.getConnectedInstances();
  }

  @Post('instances/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async connectInstance(@Body() connectDto: ConnectInstanceDto) {
    return this.federationService.connectToInstance(connectDto);
  }

  @Post('instances/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async blockInstance(@Param('id') instanceId: string) {
    await this.federationService.blockInstance(instanceId);
    return { success: true, message: 'Instance blocked' };
  }

  @Post('instances/:id/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async unblockInstance(@Param('id') instanceId: string) {
    await this.federationService.unblockInstance(instanceId);
    return { success: true, message: 'Instance unblocked' };
  }

  @Get('remote/users/:actorId')
  @UseGuards(JwtAuthGuard)
  async getRemoteUser(@Param('actorId') actorId: string) {
    const decodedActorId = decodeURIComponent(actorId);
    return this.federationService.fetchRemoteUser(decodedActorId);
  }

  @Get('posts/:activityId')
  @UseGuards(JwtAuthGuard)
  async getRemotePost(@Param('activityId') activityId: string) {
    const decodedActivityId = decodeURIComponent(activityId);
    return this.federationService.fetchRemotePost(decodedActivityId);
  }

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  async followRemoteUser(
    @Body() followDto: FederateFollowDto,
    @CurrentUser() user: any,
  ) {
    return this.federationService.sendFollow(followDto, userId(user));
  }

  @Post('posts/federate')
  @UseGuards(JwtAuthGuard)
  async federatePost(
    @Body() body: FederatePostRequestDto,
    @CurrentUser() user: any,
  ) {
    // The author is always the authenticated user. `localUserId` may be present
    // in the body for a future admin re-federation path, but it is ignored here
    // so a caller cannot federate someone else's post under their own token.
    const { targetInstances, ...post } = body;
    return this.federationService.federatePost(userId(user), post as any, targetInstances);
  }

  /**
   * Like a remote post, delivered to the inbox of the actor that owns it.
   *
   * The actor is taken from the request, never the body: a body-supplied author
   * would let a caller send a `Like` on someone else's behalf.
   */
  @Post('likes')
  @UseGuards(JwtAuthGuard)
  async likeRemotePost(@Body() body: FederateRemoteObjectDto, @CurrentUser() user: any) {
    return this.federationService.federateLike(userId(user), body.activityId);
  }

  @Post('likes/undo')
  @UseGuards(JwtAuthGuard)
  async unlikeRemotePost(@Body() body: FederateRemoteObjectDto, @CurrentUser() user: any) {
    return this.federationService.federateUndoLike(userId(user), body.activityId);
  }

  /** Boost a remote post. */
  @Post('announces')
  @UseGuards(JwtAuthGuard)
  async announceRemotePost(@Body() body: FederateRemoteObjectDto, @CurrentUser() user: any) {
    return this.federationService.federateAnnounce(userId(user), body.activityId);
  }

  /** Retract a boost. */
  @Post('announces/undo')
  @UseGuards(JwtAuthGuard)
  async undoAnnounceRemotePost(@Body() body: FederateRemoteObjectDto, @CurrentUser() user: any) {
    return this.federationService.federateUndoAnnounce(userId(user), body.activityId);
  }

  // There is deliberately no "federate an edit" endpoint. An edit is propagated
  // by `PostsService.update`, which is the only path that has both the new
  // content and the author's identity. A separate route here could only read
  // the *pre-edit* row and would push stale text to every peer.

  @Post('users/:remoteUserId/block')
  @UseGuards(JwtAuthGuard)
  async blockRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.blockRemoteUser(userId(user), remoteUserId);
    return { success: true, message: 'Remote user blocked' };
  }

  @Post('users/:remoteUserId/unblock')
  @UseGuards(JwtAuthGuard)
  async unblockRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.unblockRemoteUser(userId(user), remoteUserId);
    return { success: true, message: 'Remote user unblocked' };
  }

  @Post('users/:remoteUserId/mute')
  @UseGuards(JwtAuthGuard)
  async muteRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.muteRemoteUser(userId(user), remoteUserId);
    return { success: true, message: 'Remote user muted' };
  }

  @Post('users/:remoteUserId/unmute')
  @UseGuards(JwtAuthGuard)
  async unmuteRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.unmuteRemoteUser(userId(user), remoteUserId);
    return { success: true, message: 'Remote user unmuted' };
  }

  @Get('moderations')
  @UseGuards(JwtAuthGuard)
  async getRemoteModerations(@CurrentUser() user: any) {
    return this.federationService.getRemoteModerations(userId(user));
  }

  /**
   * Manual re-drive for a post that failed to fan out.
   *
   * Delivery is fire-and-forget, so a post that failed while every peer was down
   * is otherwise unrecoverable — there is no queue. This gives an operator a way
   * to retry without re-posting.
   */
  @Post('posts/:id/redrive')
  @UseGuards(JwtAuthGuard)
  async redrivePost(@Param('id') id: string, @CurrentUser() user: any) {
    const authorId = userId(user);
    const post = await this.federationService.getLocalPostForFederation(id, authorId);

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const targets = await this.federationService.getFollowerInstanceDomains(authorId);
    return this.federationService.federatePost(
      authorId,
      {
        activityId: String(post.id),
        content: post.content,
        publishedAt: post.createdAt ?? new Date(),
      } as any,
      targets,
    );
  }

  /**
   * The federated timeline: remote posts, newest first.
   *
   * Public, but personalized when a token is supplied — an anonymous visitor gets
   * the raw public feed, a signed-in viewer additionally gets their blocks and
   * mutes applied. `OptionalJwtAuthGuard` is deliberate rather than a bare
   * `JwtAuthGuard` (which would lock anonymous users out of a public feed) and
   * rather than no guard at all (which would silently drop moderation).
   */
  @Get('timeline')
  @UseGuards(OptionalJwtAuthGuard)
  async getFederatedTimeline(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeMuted') includeMuted?: string,
  ) {
    const user = req?.user;
    return this.federationService.getFederatedTimeline(userId(user) ?? null, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      includeMuted: includeMuted === 'true',
    });
  }

  @Get('inbound-followers')
  @UseGuards(JwtAuthGuard)
  async getInboundFollowers(@CurrentUser() user: any) {
    const follows = await this.federationService.getInboundFollowers(userId(user));
    return {
      total: follows.length,
      followers: follows.map((follow: any) => ({
        id: follow.id,
        actorId: follow.remoteUser?.actorId,
        username: follow.remoteUser?.username,
        instance: follow.remoteUser?.instance?.domain,
        followedAt: follow.createdAt,
      })),
    };
  }

  @Get('posts/:activityId/replies')
  @UseGuards(JwtAuthGuard)
  async getRemoteReplies(@Param('activityId') activityId: string) {
    const decodedActivityId = decodeURIComponent(activityId);
    return this.federationService.getRemoteReplies(decodedActivityId);
  }

  @Get('stats')
  async getStats() {
    return this.federationService.getInstanceFederationStats();
  }

  @Get('interoperability/:domain')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async probeInteroperability(@Param('domain') domain: string) {
    return this.federationService.probeInteroperability(domain);
  }

  @Get('/.well-known/webfinger')
  async webfinger(@Query('resource') resource: string) {
    if (!resource) {
      throw new HttpException('Resource parameter required', HttpStatus.BAD_REQUEST);
    }
    return this.federationService.webfinger(resource);
  }

  @Get('/.well-known/nodeinfo')
  async nodeInfo() {
    return {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/federation/.well-known/nodeinfo/2.0`,
        },
      ],
    };
  }

  @Get('.well-known/nodeinfo/2.0')
  async nodeInfo2() {
    return {
      version: '2.0',
      software: {
        name: 'zynkra',
        version: '1.0.0',
      },
      protocols: ['activitypub'],
      services: {
        inbound: [],
        outbound: [],
      },
      openRegistrations: false,
      usage: {
        users: {
          total: 0,
          activeHalfYear: 0,
          activeMonth: 0,
        },
      },
      metadata: {
        nodeName: 'Zynkra',
      },
    };
  }

  @Post('/inbox')
  async sharedInbox(@Body() activity: any, @Req() req: any) {
    await this.assertSignedInbound(req, activity);
    return this.federationService.processSharedInbox(activity);
  }

  @Get('users/:username')
  async getUserActor(@Param('username') username: string) {
    return this.federationService.getLocalActor(username);
  }

  @Get('users/:username/followers')
  async getUserFollowers(@Param('username') username: string) {
    return this.federationService.getLocalFollowers(username);
  }

  @Get('users/:username/following')
  async getUserFollowing(@Param('username') username: string) {
    return this.federationService.getLocalFollowing(username);
  }

  @Get('users/:username/outbox')
  async getUserOutbox(@Param('username') username: string) {
    return this.federationService.getLocalOutbox(username);
  }

  @Post('users/:username/inbox')
  async userInbox(
    @Param('username') username: string,
    @Body() activity: any,
    @Req() req: any,
  ) {
    await this.assertSignedInbound(req, activity);
    return this.federationService.processUserInbox(username, activity);
  }

  /**
   * Reject inbound activities that do not carry a verifiable HTTP Signature.
   *
   * Both inbox endpoints are unauthenticated by design — ActivityPub has no
   * bearer tokens — so before this existed, *anyone* could POST a `Follow` or
   * `Create` and have it persisted and answered with an `Accept`. The signature
   * is the only thing that distinguishes a real remote server from a forged
   * request, so it is verified here rather than trusted.
   *
   * `rawBody` is used, never the parsed object: re-serializing would not
   * reproduce the exact bytes that were signed.
   */
  private async assertSignedInbound(req: any, activity: any): Promise<void> {
    if (!this.httpSignaturesService.isInboundVerificationRequired()) return;

    const parsed = this.httpSignaturesService.parseSignatureHeader(
      req?.headers?.signature,
    );
    if (!parsed) {
      throw new HttpException(
        'Missing or malformed HTTP Signature header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // The keyId identifies the signing actor: `https://host/users/alice#main-key`.
    // The fragment is not part of the fetchable URL.
    const actorUrl = parsed.keyId.split('#')[0];
    if (!actorUrl) {
      throw new HttpException('Signature keyId is not a valid actor URL', HttpStatus.UNAUTHORIZED);
    }

    // A signature proves control of the key, not that the activity came from that
    // actor. Without this check, any server with a valid key could attribute its
    // activity to a third party by setting `actor` to someone else's URL.
    if (activity?.actor && activity.actor !== actorUrl) {
      throw new HttpException(
        'Activity actor does not match the signing keyId',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const publicKeyPem = await this.httpSignaturesService.fetchActorPublicKey(actorUrl, actorUrl);
    if (!publicKeyPem) {
      throw new HttpException(
        'Could not resolve the signing actor public key',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = this.httpSignaturesService.verifyRequestSignature({
      method: req.method,
      path: req.originalUrl || req.url,
      headers: req.headers || {},
      rawBody: req.rawBody ?? null,
      publicKeyPem,
      parsed,
    });

    if (!result.valid) {
      throw new HttpException(
        `Invalid HTTP Signature: ${result.reason}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

/**
 * The authenticated user's id.
 *
 * `JwtStrategy` publishes the subject as `userId` with an `id` alias, and both
 * spellings are spread across this controller. Every mutating route has to pick
 * one deliberately: reading `user.id` where only `userId` is present yields
 * `undefined`, which then gets sent to the federation service as the actor.
 */
function userId(user: any): string {
  return user?.userId || user?.id;
}
