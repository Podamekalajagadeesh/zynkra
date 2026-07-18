import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveshoppingService } from './liveshopping.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveshoppingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveshoppingService: LiveshoppingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-event')
  async handleJoinEvent(client: Socket, eventId: string) {
    client.join(eventId);
    await this.liveshoppingService.incrementViewerCount(eventId);
    
    // Broadcast updated viewer count to all clients in the room
    const event = await this.liveshoppingService.findOne(eventId);
    this.server.to(eventId).emit('viewer-count-update', event.viewerCount);
  }

  @SubscribeMessage('leave-event')
  async handleLeaveEvent(client: Socket, eventId: string) {
    client.leave(eventId);
    await this.liveshoppingService.decrementViewerCount(eventId);
    
    // Broadcast updated viewer count to all clients in the room
    const event = await this.liveshoppingService.findOne(eventId);
    this.server.to(eventId).emit('viewer-count-update', event.viewerCount);
  }

  @SubscribeMessage('feature-product')
  async handleFeatureProduct(client: Socket, data: { eventId: string; productId: string }) {
    const { eventId, productId } = data;
    // Broadcast to all clients in the event that a product is being featured
    this.server.to(eventId).emit('product-featured', { productId });
  }

  @SubscribeMessage('start-flash-sale')
  async handleStartFlashSale(
    client: Socket,
    data: { eventId: string; productId: string; durationMinutes: number; discountPercentage: number },
  ) {
    const { eventId, productId, durationMinutes, discountPercentage } = data;
    // Broadcast flash sale start to all clients in the event
    this.server.to(eventId).emit('flash-sale-started', {
      productId,
      durationMinutes,
      discountPercentage,
      endsAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    });
  }
}