import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LivestreamService } from './livestream.service';
import { TippingService } from '../../src/tipping/tipping.service';
import { CreateTipDto } from '../../src/tipping/dto/create-tip.dto';
import { LivestreamChatService } from './livestream-chat.service';
import { UsersService } from '../../src/users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LivestreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
            private readonly livestreamService: LivestreamService,
            private readonly tippingService: TippingService,
            private readonly chatService: LivestreamChatService,
            private readonly usersService: UsersService,
          ) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('start-stream')
  async handleStartStream(client: Socket, streamKey: string) {
    const stream = await this.livestreamService.getStreamByKey(streamKey);
    if (stream) {
      client.join(stream.id);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    client.to(room).emit('user-connected', client.id);
    this.server.to(room).emit('viewer-joined', client.id);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    client.to(room).emit('user-disconnected', client.id);
  }

  @SubscribeMessage('signal')
  handleSignal(client: Socket, data: { signal: any; room: string }) {
    client.to(data.room).emit('signal', { signal: data.signal, senderId: client.id });
  }

  @SubscribeMessage('stream')
  handleStream(client: Socket, data: { stream: any; room: string }) {
    client.to(data.room).emit('stream', data.stream);
  }

  // @SubscribeMessage('tip')
  // async handleTip(
  //   @MessageBody() data: { room: string; createTipDto: CreateTipDto },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const tip = await this.tippingService.tip(data.createTipDto);
  //   client.to(data.room).emit('tip', tip);
  // }

  // @SubscribeMessage('new-comment')
  // async handleNewComment(
  //   @MessageBody() data: { content: string; streamId: string; userId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const user = await this.usersService.findOne(data.userId);
  //   const comment = await this.chatService.createComment(
  //     data.content,
  //     user,
  //     data.streamId,
  //   );
  //   this.server.to(data.streamId).emit('new-comment', comment);
  // }

  // @SubscribeMessage('get-comments')
  // async handleGetComments(
  //   @MessageBody() streamId: string,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const comments = await this.chatService.getComments(streamId);
  //   client.emit('comments', comments);
  // }

  // @SubscribeMessage('delete-comment')
  // async handleDeleteComment(
  //   @MessageBody() data: { commentId: string; userId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   await this.chatService.deleteComment(data.commentId, data.userId);
  //   this.server.emit('comment-deleted', data.commentId);
  // }

  // @SubscribeMessage('invite-guest')
  // handleInviteGuest(
  //   @MessageBody() data: { guestId: string; room: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   client.to(data.room).emit('guest-invite', { guestId: data.guestId, hostId: client.id });
  // }

  // @SubscribeMessage('accept-invite')
  // handleAcceptInvite(
  //   @MessageBody() data: { hostId: string; room: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   client.to(data.room).emit('guest-joined', { guestId: client.id, hostId: data.hostId });
  // }

  // @SubscribeMessage('leave-stream')
  // handleLeaveStream(
  //   @MessageBody() room: string,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   client.to(room).emit('guest-left', client.id);
  // }
}