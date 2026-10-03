import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, ConfigService } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LiveshoppingService } from './liveshopping.service';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway()
export class LiveshoppingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(LiveshoppingGateway.name);

  constructor(
    private readonly liveshoppingService: LiveshoppingService,
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: WsRateLimiter,
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.rateLimiter.release(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private mayAct(client: Socket, id: unknown): boolean {
    if (!client.data.userId || typeof id !== 'string' || id.length === 0) {
      return false;
    }
    return this.rateLimiter.allow(client, client.data.userId as string);
  }

  @SubscribeMessage('join-event')
  async handleJoinEvent(client: Socket, eventId: string) {
    if (!this.mayAct(client, eventId)) return;
    client.join(eventId);
    await this.liveshoppingService.incrementViewerCount(eventId);

    // Broadcast updated viewer count to all clients in the room
    const event = await this.liveshoppingService.findOne(eventId);
    this.server.to(eventId).emit('viewer-count-update', event.viewerCount);
  }

  @SubscribeMessage('leave-event')
  async handleLeaveEvent(client: Socket, eventId: string) {
    if (!this.mayAct(client, eventId)) return;
    client.leave(eventId);
    await this.liveshoppingService.decrementViewerCount(eventId);

    // Broadcast updated viewer count to all clients in the room
    const event = await this.liveshoppingService.findOne(eventId);
    this.server.to(eventId).emit('viewer-count-update', event.viewerCount);
  }

  @SubscribeMessage('feature-product')
  async handleFeatureProduct(client: Socket, data: { eventId: string; productId: string }) {
    if (!this.mayAct(client, data?.eventId)) return;
    const { eventId, productId } = data;
    // Broadcast to all clients in the event that a product is being featured
    this.server.to(eventId).emit('product-featured', { productId });
  }

  @SubscribeMessage('start-flash-sale')
  async handleStartFlashSale(
    client: Socket,
    data: { eventId: string; productId: string; durationMinutes: number; discountPercentage: number },
  ) {
    if (!this.mayAct(client, data?.eventId)) return;
    const { eventId, productId, durationMinutes, discountPercentage } = data;

    const product = await this.liveshoppingService.findOne(eventId);
    if (!product) return;
    // Only the event's own host may start a flash sale. Previously any
    // authenticated client could announce one to every viewer in the room.
    if (product.hostId !== (client.data.userId as string)) return;

    this.server.to(eventId).emit('flash-sale-started', {
      productId,
      durationMinutes,
      discountPercentage,
      endsAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    });
  }
}
