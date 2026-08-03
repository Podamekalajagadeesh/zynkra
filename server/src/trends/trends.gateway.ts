import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrendsService } from './trends.service';

@WebSocketGateway({
  namespace: '/trends',
  cors: { origin: '*' },
})
export class TrendsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TrendsGateway.name);

  constructor(private readonly trendsService: TrendsService) {}

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
