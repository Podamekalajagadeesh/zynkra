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
} from '@nestjs/common';
import { FederationService } from './federation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../roles.enum';
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

  @Get('users/:actorId')
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

  @Get('stats')
  async getStats() {
    return this.federationService.getInstanceFederationStats();
  }

  @Get('.well-known/webfinger')
  async webfinger(@Param('resource') resource: string) {
    if (!resource) {
      throw new HttpException('Resource parameter required', HttpStatus.BAD_REQUEST);
    }
    return this.federationService.webfinger(resource);
  }

  @Post('inbox')
  async sharedInbox(@Body() activity: any) {
    console.log('Received ActivityPub activity:', activity);
    return { success: true };
  }

  @Get('users/:username')
  async getUserActor(@Param('username') username: string) {
    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
      ],
      id: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/users/${username}`,
      type: 'Person',
      preferredUsername: username,
      inbox: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/federation/users/${username}/inbox`,
      outbox: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/federation/users/${username}/outbox`,
      followers: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/federation/users/${username}/followers`,
      following: `${process.env.INSTANCE_BASE_URL || 'http://localhost:3001'}/federation/users/${username}/following`,
    };
  }

  @Post('users/:username/inbox')
  async userInbox(@Param('username') username: string, @Body() activity: any) {
    console.log(`Received activity in ${username}'s inbox:`, activity);
    return { success: true };
  }
}