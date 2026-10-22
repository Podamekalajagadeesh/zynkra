import { ConfigService } from '@nestjs/config';
import { resolveWsOrigins } from './ws-cors';

function config(env: Record<string, string | undefined>) {
  return { get: (k: string) => env[k] } as unknown as ConfigService;
}

describe('resolveWsOrigins', () => {
  describe('production', () => {
    const prod = (env: Record<string, string | undefined>) =>
      resolveWsOrigins(config({ NODE_ENV: 'production', ...env }));

    it('uses WS_ALLOWED_ORIGINS when set', () => {
      expect(prod({ WS_ALLOWED_ORIGINS: 'https://a.example,https://b.example' })).toEqual([
        'https://a.example',
        'https://b.example',
      ]);
    });

    it('falls back to CLIENT_URL rather than allowing every origin', () => {
      // Regression: an earlier version allowed CLIENT_URL or nothing, and
      // "nothing" rejects every browser socket, which looks like real-time
      // being broken rather than a misconfiguration.
      expect(prod({ CLIENT_URL: 'https://app.example' })).toEqual(['https://app.example']);
    });

    it('prefers the explicit allowlist over CLIENT_URL', () => {
      expect(
        prod({ WS_ALLOWED_ORIGINS: 'https://sockets.example', CLIENT_URL: 'https://app.example' })
      ).toContain('https://sockets.example');
    });

    it('does not add local dev origins', () => {
      const origins = prod({ CLIENT_URL: 'https://app.example' });
      expect(origins).not.toContain('http://localhost:5173');
    });

    it('throws rather than defaulting to a wildcard when nothing is configured', () => {
      expect(() => prod({})).toThrow(/No WebSocket origins configured/);
    });

    it('deduplicates', () => {
      expect(
        prod({ WS_ALLOWED_ORIGINS: 'https://a.example', CLIENT_URL: 'https://a.example' })
      ).toEqual(['https://a.example']);
    });
  });

  describe('development', () => {
    it('always allows the local dev origins', () => {
      const origins = resolveWsOrigins(
        config({ NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' })
      );
      expect(origins).toContain('http://localhost:5173');
      expect(origins).toContain('http://127.0.0.1:5173');
    });

    it('works with no configuration at all', () => {
      const origins = resolveWsOrigins(config({ NODE_ENV: 'development' }));
      expect(origins.length).toBeGreaterThan(0);
    });

    it('still honours an explicit allowlist', () => {
      const origins = resolveWsOrigins(
        config({ NODE_ENV: 'development', WS_ALLOWED_ORIGINS: 'https://staging.example' })
      );
      expect(origins).toContain('https://staging.example');
    });
  });

  it('trims whitespace around comma-separated entries', () => {
    expect(
      resolveWsOrigins(
        config({
          NODE_ENV: 'production',
          WS_ALLOWED_ORIGINS: ' https://a.example , https://b.example ',
        })
      )
    ).toEqual(['https://a.example', 'https://b.example']);
  });
});
