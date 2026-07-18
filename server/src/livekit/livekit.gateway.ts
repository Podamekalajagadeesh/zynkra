import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveKitService } from './livekit.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveKitGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly liveKitService: LiveKitService) {}

  async handleConnection(client: Socket) {
    console.log(`LiveKit client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`LiveKit client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-stream')
  async handleJoinStream(client: Socket, payload: { roomName: string; userId: string; isHost: boolean }) {
    const { roomName, userId, isHost } = payload;
    
    // Ensure room exists with max 10 participants
    await this.liveKitService.createRoom(roomName, 10);
    
    // Generate LiveKit token for the user
    const token = await this.liveKitService.generateToken(userId, roomName, isHost);
    
    // Send token back to client
    client.emit('stream-token', { token, roomName });
    
    // Broadcast to all users in room that a new participant joined
    this.server.to(roomName).emit('participant-joined', { userId });
  }

  @SubscribeMessage('invite-guest')
  async handleInviteGuest(client: Socket, payload: { roomName: string; guestId: string; hostId: string }) {
    const { roomName, guestId, hostId } = payload;
    
    // Send invite to specific guest
    this.server.to(guestId).emit('stream-invite', { 
      roomName, 
      hostId,
      message: 'You have been invited to join the livestream as a guest'
    });
  }

  @SubscribeMessage('leave-stream')
  async handleLeaveStream(client: Socket, payload: { roomName: string; userId: string }) {
    const { roomName, userId } = payload;
    this.server.to(roomName).emit('participant-left', { userId });
  }
}