import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In a real app, restrict this to your client's URL
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  private users = new Map<string, string>(); // Map of userId to socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.users.set(userId, client.id);
      this.logger.log(`Client connected: ${client.id}, user: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.users.entries()].find(([, socketId]) => socketId === client.id)?.[0];
    if (userId) {
      this.users.delete(userId);
      this.logger.log(`Client disconnected: ${client.id}, user: ${userId}`);
    }
  }

  sendNotificationToUser(userId: string, payload: any) {
    const socketId = this.users.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', payload);
      this.logger.log(`Sent notification to user ${userId} on socket ${socketId}`);
    }
  }
}