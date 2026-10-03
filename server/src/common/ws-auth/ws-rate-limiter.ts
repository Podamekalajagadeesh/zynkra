import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Per-socket message rate limiter.
 *
 * The HTTP throttler (`HttpThrottlerGuard`) deliberately no-ops outside HTTP
 * contexts, so gateway messages were completely unthrottled. That was mostly
 * academic while sockets were unauthenticated and therefore useless — but now
 * that every namespace requires a verified token, an authenticated client can
 * hold a socket and emit without limit.
 *
 * This is a fixed-window counter keyed by socket id (scoped to the authenticated
 * userId for logging), so one abusive socket cannot exhaust another user's
 * budget. When the window is exhausted the message is dropped and an `error`
 * event is emitted; the connection is only closed after `closeAfter`
 * consecutive violations, so a client that trips the limit briefly recovers.
 */
@Injectable()
export class WsRateLimiter {
  private readonly logger = new Logger(WsRateLimiter.name);

  private readonly limit: number;
  private readonly windowMs: number;
  private readonly closeAfter: number;
  private readonly sweepTimer: NodeJS.Timeout;

  private readonly state = new Map<string, { userId: string; count: number; windowStart: number; strikes: number }>();

  constructor(configService: ConfigService) {
    this.limit = configService.get<number>('WS_RATE_LIMIT_PER_MINUTE', 240);
    this.windowMs = 60_000;
    this.closeAfter = configService.get<number>('WS_RATE_LIMIT_CLOSE_AFTER', 5);
    // A process that never observes a disconnect would otherwise accumulate
    // counters forever.
    this.sweepTimer = setInterval(() => this.sweep(), this.windowMs);
    this.sweepTimer.unref?.();
  }

  /**
   * Records one inbound message.
   *
   * @returns true when the message may proceed; false when it was dropped.
   * Disconnects the socket itself once it has exceeded the limit too many
   * consecutive times, so callers do not handle that case.
   */
  allow(
    client: { id: string; emit?: Function; disconnect?: Function },
    userId: string | undefined,
  ): boolean {
    const key = client.id;
    const now = Date.now();
    const existing = this.state.get(key);

    if (!existing || now - existing.windowStart >= this.windowMs) {
      this.state.set(key, { userId: userId ?? 'unknown', count: 1, windowStart: now, strikes: 0 });
      return true;
    }

    existing.count += 1;
    if (existing.count <= this.limit) {
      return true;
    }

    existing.strikes += 1;
    if (existing.strikes >= this.closeAfter) {
      this.logger.warn(
        `Dropping socket ${key} (user ${existing.userId}): ${existing.count} messages/min, ` +
          `${existing.strikes} consecutive violations`,
      );
      this.state.delete(key);
      this.emitError(client, 'Rate limit exceeded. Reconnect later.');
      client.disconnect?.(true);
      return false;
    }

    this.emitError(client, 'Rate limit exceeded. Slow down.');
    return false;
  }

  private emitError(client: { emit?: Function }, message: string): void {
    try {
      client.emit?.('error', { message });
    } catch {
      // The socket may already be closed; nothing useful to do.
    }
  }

  /** Forget a socket's counters. Call from `handleDisconnect`. */
  release(clientId: string): void {
    this.state.delete(clientId);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.state) {
      if (now - entry.windowStart >= this.windowMs * 2) {
        this.state.delete(key);
      }
    }
  }

  getTrackedSockets(): number {
    return this.state.size;
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
  }
}
