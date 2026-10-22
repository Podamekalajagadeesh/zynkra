import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupPrivacy } from './enums/group-privacy.enum';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway({ namespace: '/channels' })
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChannelsGateway');

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: WsRateLimiter,
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.rateLimiter.release(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private mayAct(client: Socket, channelId: unknown): boolean {
    if (!client.data.userId || typeof channelId !== 'string' || channelId.length === 0) {
      return false;
    }
    return this.rateLimiter.allow(client, client.data.userId as string);
  }

  // Mirrors GroupsService.assertCanReadChannel — the socket path must not
  // be a hole around the REST access checks.
  private async canRead(channelId: string, userId: string): Promise<boolean> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['group'],
    });
    if (!channel || !channel.group) return false;
    if (channel.group.privacy === GroupPrivacy.PUBLIC) return true;
    const member = await this.groupMembersRepository.findOne({
      where: { group: { id: channel.group.id }, user: { id: userId } },
    });
    return !!member;
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(client: Socket, channelId: string) {
    if (!this.mayAct(client, channelId)) return;
    if (!(await this.canRead(channelId, client.data.userId as string))) return;
    client.join(channelId);
    client.emit('joinedChannel', channelId);
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(client: Socket, channelId: string) {
    if (!this.mayAct(client, channelId)) return;
    client.leave(channelId);
    client.emit('leftChannel', channelId);
  }

  sendMessageToChannel(channelId: string, message: any) {
    this.server.to(channelId).emit('newMessage', message);
  }
}
