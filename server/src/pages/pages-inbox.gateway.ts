import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PageInboxService } from './pages-inbox.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({ namespace: '/page-inbox' })
@UseGuards(JwtAuthGuard)
export class PageInboxGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly pageInboxService: PageInboxService) {}

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(conversationId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    payload: { conversationId: string; content: string },
    @CurrentUser() user: User,
  ) {
    const message = await this.pageInboxService.createMessage(
      payload.conversationId,
      payload.content,
      user,
    );
    this.server.to(payload.conversationId).emit('newMessage', message);
  }
}