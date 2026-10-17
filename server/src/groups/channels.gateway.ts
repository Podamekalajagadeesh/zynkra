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
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway({ namespace: '/channels' })
export class ChannelsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChannelsGateway');

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: WsRateLimiter,
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

  @SubscribeMessage('joinChannel')
  handleJoinChannel(client: Socket, channelId: string) {
    if (!this.mayAct(client, channelId)) return;
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