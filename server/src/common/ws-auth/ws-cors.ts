import { ConfigService } from '@nestjs/config';
import type { Server } from 'socket.io';

/**
 * Resolve the allowed WebSocket origins from configuration.
 *
 * `@WebSocketGateway({ cors })` is evaluated at *import* time, before
 * `ConfigModule` has loaded `.env`, so a gateway decorator cannot read
 * `CLIENT_URL`. The gateways that used a decorator-supplied `cors` therefore
 * hardcoded `origin: '*'`, which lets any site open a socket. Gateways call
 * this from `afterInit` instead, where the config is available.
 *
 * Falls back to the same dev origins the REST CORS config allows, so local
 * development keeps working without extra configuration.
 */
export function resolveWsOrigins(configService: ConfigService): string[] {
  const explicit = configService.get<string>('WS_ALLOWED_ORIGINS');
  const configured = [
    // An explicit allowlist always wins.
    explicit,
    // Falling back to CLIENT_URL matters: without it, a production deploy that
    // sets CLIENT_URL but not WS_ALLOWED_ORIGINS would reject every browser
    // socket, which looks exactly like "real-time is broken".
    configService.get<string>('CLIENT_URL'),
  ]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const devOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081', // React Native dev
    'http://127.0.0.1:8081',
  ];

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const allowed = isProduction ? configured : [...new Set([...configured, ...devOrigins])];

  if (allowed.length === 0) {
    throw new Error(
      'No WebSocket origins configured. Set WS_ALLOWED_ORIGINS (comma-separated) or CLIENT_URL. ' +
        'Refusing to start rather than accepting connections from any origin.'
    );
  }

  return [...new Set(allowed)];
}

/**
 * Apply the resolved CORS policy to a live Socket.IO server.
 *
 * Socket.IO stores the options on `server.engine.opts.cors` *and* on the
 * underlying HTTP server, and it reads `opts.cors` when handling each
 * handshake — so this must run after the engine is created, which is why it
 * belongs in `afterInit` rather than the decorator.
 */
export function applyWsCors(server: Server, configService: ConfigService): void {
  const origin = resolveWsOrigins(configService);
  const engine = (server as any)?.engine;

  if (engine?.opts) {
    engine.opts.cors = { ...(engine.opts.cors ?? {}), origin };
  }

  const httpServer = engine?.httpServer;
  if (httpServer) {
    // @fastify/cors-compatible shape; the Node http server path reads
    // `server._httpServer` and this is the documented override point.
    (httpServer as any)._cors = { origin };
  }
}
