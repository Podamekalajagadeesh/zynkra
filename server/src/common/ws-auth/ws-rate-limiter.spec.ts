import { ConfigService } from '@nestjs/config';
import { WsRateLimiter } from './ws-rate-limiter';

function makeClient(id = 'sock-1') {
  return { id, emit: jest.fn(), disconnect: jest.fn() };
}

function makeLimiter(limit = 3, closeAfter = 2) {
  const config = {
    get: (key: string, fallback?: number) =>
      key === 'WS_RATE_LIMIT_PER_MINUTE'
        ? limit
        : key === 'WS_RATE_LIMIT_CLOSE_AFTER'
          ? closeAfter
          : fallback,
  } as unknown as ConfigService;
  return new WsRateLimiter(config);
}

describe('WsRateLimiter', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows messages up to the limit', () => {
    const limiter = makeLimiter(3, 5);
    const client = makeClient();
    expect(limiter.allow(client, 'u1')).toBe(true);
    expect(limiter.allow(client, 'u1')).toBe(true);
    expect(limiter.allow(client, 'u1')).toBe(true);
    expect(client.disconnect).not.toHaveBeenCalled();
    limiter.onModuleDestroy();
  });

  it('drops the message past the limit and tells the client', () => {
    const limiter = makeLimiter(2, 5);
    const client = makeClient();
    limiter.allow(client, 'u1');
    limiter.allow(client, 'u1');
    expect(limiter.allow(client, 'u1')).toBe(false);
    expect(client.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.stringContaining('Rate limit') })
    );
    expect(client.disconnect).not.toHaveBeenCalled();
    limiter.onModuleDestroy();
  });

  it('disconnects only after closeAfter consecutive violations', () => {
    const limiter = makeLimiter(1, 2);
    const client = makeClient();
    limiter.allow(client, 'u1'); // 1 — within limit
    expect(limiter.allow(client, 'u1')).toBe(false); // strike 1
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(limiter.allow(client, 'u1')).toBe(false); // strike 2
    expect(client.disconnect).toHaveBeenCalledWith(true);
    limiter.onModuleDestroy();
  });

  it('resets the window after it elapses', () => {
    jest.useFakeTimers();
    const limiter = makeLimiter(1, 5);
    const client = makeClient();
    expect(limiter.allow(client, 'u1')).toBe(true);
    expect(limiter.allow(client, 'u1')).toBe(false);
    jest.advanceTimersByTime(61_000);
    expect(limiter.allow(client, 'u1')).toBe(true);
    limiter.onModuleDestroy();
  });

  it('tracks sockets independently', () => {
    const limiter = makeLimiter(1, 5);
    const a = makeClient('a');
    const b = makeClient('b');
    expect(limiter.allow(a, 'u1')).toBe(true);
    expect(limiter.allow(a, 'u1')).toBe(false);
    // b has its own budget
    expect(limiter.allow(b, 'u2')).toBe(true);
    expect(limiter.getTrackedSockets()).toBe(2);
    limiter.onModuleDestroy();
  });

  it('forgets a released socket', () => {
    const limiter = makeLimiter(1, 5);
    const client = makeClient();
    limiter.allow(client, 'u1');
    expect(limiter.getTrackedSockets()).toBe(1);
    limiter.release(client.id);
    expect(limiter.getTrackedSockets()).toBe(0);
    limiter.onModuleDestroy();
  });

  it('does not throw when the socket is already closed', () => {
    const limiter = makeLimiter(1, 1);
    const client = {
      id: 'x',
      emit: jest.fn(() => {
        throw new Error('closed');
      }),
      disconnect: jest.fn(),
    };
    expect(limiter.allow(client, 'u1')).toBe(true);
    expect(() => limiter.allow(client, 'u1')).not.toThrow();
    limiter.onModuleDestroy();
  });
});
