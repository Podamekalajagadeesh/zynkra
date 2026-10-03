import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// No `cors` in the decorator: it is evaluated at import time, before
// ConfigModule has loaded .env, which is why this used to be hardcoded to
// `origin: '*'`. It is applied in afterInit instead.
@WebSocketGateway({
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  /** userId -> socketId. A user may hold several sockets; all are tracked. */
  private socketsByUser = new Map<string, Set<string>>();

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    // Identity comes from a verified JWT + live LoginSession, never from a
    // client-supplied userId. Previously the userId came from the query string,
    // so anyone who knew a UUID could subscribe to that user's notifications.
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }

    const userId = client.data.userId as string;
    const sockets = this.socketsByUser.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.socketsByUser.set(userId, sockets);
    this.logger.log(`Client connected: ${client.id}, user: ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }
    const sockets = this.socketsByUser.get(userId);
    sockets?.delete(client.id);
    if (sockets && sockets.size === 0) {
      this.socketsByUser.delete(userId);
    }
    this.logger.log(`Client disconnected: ${client.id}, user: ${userId}`);
  }

  sendNotificationToUser(userId: string, payload: any) {
    const socketIds = this.socketsByUser.get(userId);
    if (!socketIds || socketIds.size === 0) {
      return;
    }
    for (const socketId of socketIds) {
      this.server.to(socketId).emit('notification', payload);
    }
    this.logger.log(`Sent notification to user ${userId} on ${socketIds.size} socket(s)`);
  }
}
