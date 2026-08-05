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
} from '@nestjs/common';
import { FederationService } from './federation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/roles.enum';
import { ConnectInstanceDto } from './dto/remote-instance.dto';
import { FederateFollowDto } from './dto/federate-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('federation')
export class FederationController {
  constructor(private readonly federationService: FederationService) {}

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
    return this.federationService.sendFollow(followDto, user.id);
  }

  @Post('users/:remoteUserId/block')
  @UseGuards(JwtAuthGuard)
  async blockRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.blockRemoteUser(user.userId || user.id, remoteUserId);
    return { success: true, message: 'Remote user blocked' };
  }

  @Post('users/:remoteUserId/unblock')
  @UseGuards(JwtAuthGuard)
  async unblockRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.unblockRemoteUser(user.userId || user.id, remoteUserId);
    return { success: true, message: 'Remote user unblocked' };
  }

  @Post('users/:remoteUserId/mute')
  @UseGuards(JwtAuthGuard)
  async muteRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.muteRemoteUser(user.userId || user.id, remoteUserId);
    return { success: true, message: 'Remote user muted' };
  }

  @Post('users/:remoteUserId/unmute')
  @UseGuards(JwtAuthGuard)
  async unmuteRemoteUser(@Param('remoteUserId') remoteUserId: string, @CurrentUser() user: any) {
    await this.federationService.unmuteRemoteUser(user.userId || user.id, remoteUserId);
    return { success: true, message: 'Remote user unmuted' };
  }

  @Get('moderations')
  @UseGuards(JwtAuthGuard)
  async getRemoteModerations(@CurrentUser() user: any) {
    return this.federationService.getRemoteModerations(user.userId || user.id);
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
  async sharedInbox(@Body() activity: any) {
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
  async userInbox(@Param('username') username: string, @Body() activity: any) {
    return this.federationService.processUserInbox(username, activity);
  }
}