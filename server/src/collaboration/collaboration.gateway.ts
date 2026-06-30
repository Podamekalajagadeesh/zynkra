import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(private readonly collaborationService: CollaborationService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Collaboration client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Collaboration client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-editing-room')
  async handleJoinEditingRoom(client: Socket, payload: { postId: string; userId: string; displayName: string }) {
    const { postId, userId, displayName } = payload;
    
    // Add user to the editing room
    await this.collaborationService.addCollaboratorToRoom(postId, userId, displayName);
    client.join(postId);
    
    // Notify everyone in the room
    this.server.to(postId).emit('collaborator-joined', { userId, displayName });
    
    // Send current collaborators list to the new user
    const collaborators = this.collaborationService.getActiveCollaborators(postId);
    client.emit('active-collaborators', collaborators);
  }

  @SubscribeMessage('leave-editing-room')
  async handleLeaveEditingRoom(client: Socket, payload: { postId: string; userId: string }) {
    const { postId, userId } = payload;
    
    await this.collaborationService.removeCollaboratorFromRoom(postId, userId);
    client.leave(postId);
    
    this.server.to(postId).emit('collaborator-left', { userId });
  }

  @SubscribeMessage('content-update')
  async handleContentUpdate(client: Socket, payload: { postId: string; userId: string; content: any; timestamp: number }) {
    const { postId, userId, content, timestamp } = payload;
    
    // Broadcast the update to everyone else in the room
    client.to(postId).emit('content-updated', { userId, content, timestamp });
    
    // Save the latest version
    await this.collaborationService.saveDraftVersion(postId, content, userId);
  }

  @SubscribeMessage('cursor-position')
  async handleCursorPosition(client: Socket, payload: { postId: string; userId: string; position: { x: number; y: number } }) {
    const { postId, userId, position } = payload;
    client.to(postId).emit('cursor-moved', { userId, position });
  }

  @SubscribeMessage('selection-change')
  async handleSelectionChange(client: Socket, payload: { postId: string; userId: string; selection: any }) {
    const { postId, userId, selection } = payload;
    client.to(postId).emit('selection-changed', { userId, selection });
  }

  @SubscribeMessage('invite-collaborator')
  async handleInviteCollaborator(client: Socket, payload: { postId: string; hostId: string; guestId: string; guestEmail: string }) {
    const { postId, hostId, guestId, guestEmail } = payload;
    
    // Add collaborator to the post's permanent list
    await this.collaborationService.addPermanentCollaborator(postId, guestId);
    
    // Send notification to the invited user (could be via email or in-app)
    this.server.emit(`invite-${guestId}`, {
      type: 'collaboration-invite',
      postId,
      hostId,
      guestEmail,
      message: 'You have been invited to collaborate on a post'
    });
  }

  @SubscribeMessage('remove-collaborator')
  async handleRemoveCollaborator(client: Socket, payload: { postId: string; hostId: string; collaboratorId: string }) {
    const { postId, hostId, collaboratorId } = payload;
    
    await this.collaborationService.removePermanentCollaborator(postId, collaboratorId);
    
    // Notify the removed collaborator they no longer have access
    this.server.to(postId).emit('collaborator-removed', { collaboratorId });
    
    // Kick them from the room if they're in it
    const sockets = await this.server.in(postId).allSockets();
    for (const socketId of sockets) {
      const socketClient = this.server.sockets.sockets.get(socketId);
      if (socketClient?.handshake.query.userId === collaboratorId) {
        socketClient.leave(postId);
        socketClient.emit('access-revoked', { postId });
      }
    }
  }
}