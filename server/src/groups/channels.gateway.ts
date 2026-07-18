import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/channels' })
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChannelsGateway');

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(client: Socket, channelId: string) {
    client.join(channelId);
    client.emit('joinedChannel', channelId);
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(client: Socket, channelId: string) {
    client.leave(channelId);
    client.emit('leftChannel', channelId);
  }

  sendMessageToChannel(channelId: string, message: any) {
    this.server.to(channelId).emit('newMessage', message);
  }
}