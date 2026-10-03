import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { LiveKitService } from './livekit.service';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway()
export class LiveKitGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveKitGateway.name);

  constructor(
    private readonly liveKitService: LiveKitService,
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    this.logger.log(`LiveKit client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`LiveKit client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-stream')
  async handleJoinStream(client: Socket, payload: { roomName: string; isHost?: boolean }) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }

    // Identity comes from the authenticated socket, not the payload — the
    // previous version trusted `payload.userId`/`payload.isHost`, so any client
    // could mint a host token for any identity in any room.
    const { roomName } = payload;
    const isHost = payload.isHost === true;

    // Ensure room exists with max 10 participants
    await this.liveKitService.createRoom(roomName, 10);

    // Generate LiveKit token for the authenticated user
    const token = await this.liveKitService.generateToken(userId, roomName, isHost);

    // Send token back to client
    client.emit('stream-token', { token, roomName });

    // Broadcast to all users in room that a new participant joined
    this.server.to(roomName).emit('participant-joined', { userId });
  }

  @SubscribeMessage('invite-guest')
  async handleInviteGuest(client: Socket, payload: { roomName: string; guestId: string }) {
    const hostId = client.data.userId as string | undefined;
    if (!hostId) {
      return;
    }
    const { roomName, guestId } = payload;

    // Send invite to the specific guest's sockets
    this.server.to(guestId).emit('stream-invite', {
      roomName,
      hostId,
      message: 'You have been invited to join the livestream as a guest',
    });
  }

  @SubscribeMessage('leave-stream')
  async handleLeaveStream(client: Socket, payload: { roomName: string }) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }
    this.server.to(payload.roomName).emit('participant-left', { userId });
  }
}
