import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebRtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-call')
  handleJoinCall(client: Socket, room: string) {
    client.join(room);
    client.to(room).emit('user-joined', client.id);
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, data: { sdp: any; room: string }) {
    client.to(data.room).emit('offer', { sdp: data.sdp, from: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, data: { sdp: any; room: string }) {
    client.to(data.room).emit('answer', { sdp: data.sdp, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, data: { candidate: any; room: string }) {
    client.to(data.room).emit('ice-candidate', { candidate: data.candidate, from: client.id });
  }

  @SubscribeMessage('leave-call')
  handleLeaveCall(client: Socket, room: string) {
    client.leave(room);
    client.to(room).emit('user-left', client.id);
  }
}