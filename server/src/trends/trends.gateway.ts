import { Logger, ConfigService } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrendsService } from './trends.service';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// Read-only public feed — no authentication, but the origin is still pinned to
// the configured client so the socket is not open to any site on the internet.
@WebSocketGateway({ namespace: '/trends' })
export class TrendsGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TrendsGateway.name);

  constructor(
    private readonly trendsService: TrendsService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    // Push the current trending list immediately on subscribe so the UI is
    // never blank while waiting for the next minute tick.
    const trending = await this.trendsService.getTrending(10);
    client.emit('trends:updated', trending);
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'trends-live-broadcast' })
  async broadcastTrending(): Promise<void> {
    if (!this.server) return;
    const trending = await this.trendsService.getTrending(10);
    this.server.emit('trends:updated', trending);
  }
}
