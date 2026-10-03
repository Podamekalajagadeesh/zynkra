import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway()
export class WebRtcGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(WebRtcGateway.name);

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

  /**
   * Room membership is a socket room keyed by an opaque id. The gateway cannot
   * verify call-participant entitlement (that is a DM-permission concern), but
   * it does require an authenticated, rate-limited socket so anonymous clients
   * cannot join or flood signalling into arbitrary rooms.
   */
  private mayAct(client: Socket, room: unknown): boolean {
    if (!client.data.userId || typeof room !== 'string' || room.length === 0) {
      return false;
    }
    return this.rateLimiter.allow(client, client.data.userId as string);
  }

  @SubscribeMessage('join-call')
  handleJoinCall(client: Socket, room: string) {
    if (!this.mayAct(client, room)) return;
    client.join(room);
    client.to(room).emit('user-joined', client.id);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, data: { sdp: any; room: string }) {
    if (!this.mayAct(client, data?.room)) return;
    client.to(data.room).emit('offer', { sdp: data.sdp, from: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, data: { sdp: any; room: string }) {
    if (!this.mayAct(client, data?.room)) return;
    client.to(data.room).emit('answer', { sdp: data.sdp, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, data: { candidate: any; room: string }) {
    if (!this.mayAct(client, data?.room)) return;
    client.to(data.room).emit('ice-candidate', { candidate: data.candidate, from: client.id });
  }

  @SubscribeMessage('leave-call')
  handleLeaveCall(client: Socket, room: string) {
    if (!this.mayAct(client, room)) return;
    client.leave(room);
    client.to(room).emit('user-left', client.id);
  }
}
