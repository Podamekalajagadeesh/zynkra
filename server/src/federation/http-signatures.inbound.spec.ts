import * as crypto from 'crypto';
import { HttpException, Logger } from '@nestjs/common';
import axios from 'axios';
import { HttpSignaturesService, InboxRateLimitException } from './http-signatures.service';
import { FederationExceptionFilter } from './federation-exception.filter';

let service: any;
let publicKeyPem: string;
let privateKeyPem: string;
let instanceKeyRepository: any;
let config: Record<string, string>;

function digestOf(body: string): string {
  return `SHA-256=${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;
}

/** Produce the exact header set this service would emit for a POST to `inboxUrl`. */
function postHeaders(body: string, inboxUrl: string, actorUrl: string) {
  service = makeService();
  return service.getSignedPostHeaders(actorUrl, body, inboxUrl);
}

function makeService(configOverrides: Record<string, string> = {}) {
  config = configOverrides;
  return new (HttpSignaturesService as any)(instanceKeyRepository, {
    get: (key: string, fallback?: any) =>
      config[key] !== undefined ? config[key] : (fallback ?? null),
  });
}

function generateRemotePair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

/**
 * Build the full `verifyInboundRequest` parameter set for a *valid* signed
 * POST /inbox from `actorUrl`, signed with `remotePrivateKey`.
 */
function inboxRequest(
  actorUrl: string,
  remotePrivateKey: string,
  options: { remoteIp?: string; activity?: any } = {}
) {
  const body = JSON.stringify(
    options.activity ?? { type: 'Follow', actor: actorUrl, object: 'https://zynkra.test/x' }
  );
  const date = new Date().toUTCString();
  const digest = digestOf(body);
  const signingString = [
    '(request-target): post /inbox',
    'host: zynkra.test',
    `date: ${date}`,
    `digest: ${digest}`,
  ].join('\n');
  const signature = crypto
    .createSign('rsa-sha256')
    .update(signingString, 'utf8')
    .sign(remotePrivateKey, 'base64');
  const signatureHeader =
    `keyId="${actorUrl}#main-key",algorithm="rsa-sha256",` +
    `headers="(request-target) host date digest",signature="${signature}"`;

  return {
    method: 'POST',
    path: '/inbox',
    headers: { host: 'zynkra.test', date, digest, signature: signatureHeader },
    rawBody: Buffer.from(body, 'utf8'),
    activity: JSON.parse(body),
    remoteIp: options.remoteIp ?? '198.51.100.10',
  };
}

/** A syntactically parseable but cryptographically bogus signed request. */
function garbageSignatureRequest(actorUrl: string, remoteIp = '198.51.100.10') {
  return {
    method: 'POST',
    path: '/inbox',
    headers: {
      host: 'zynkra.test',
      date: new Date().toUTCString(),
      signature: `keyId="${actorUrl}#main-key",algorithm="rsa-sha256",headers="date",signature="AAAA"`,
    },
    rawBody: null,
    activity: { type: 'Create', actor: actorUrl },
    remoteIp,
  };
}

beforeAll(() => {
  Logger.overrideLogger(false);
  const pair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  publicKeyPem = pair.publicKey as string;
  privateKeyPem = pair.privateKey as string;
});

beforeEach(() => {
  instanceKeyRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue({ isActive: true, privateKey: privateKeyPem, publicKey: publicKeyPem }),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => ({ ...data, id: 'key-1' })),
  };
  service = makeService();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function initialized() {
  const svc = makeService();
  await svc.initialize();
  return svc;
}

describe('parseSignatureHeader', () => {
  it('parses keyId, algorithm, headers, and signature', () => {
    const parsed = service.parseSignatureHeader(
      'keyId="https://example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="YWJj"'
    );

    expect(parsed).toEqual({
      keyId: 'https://example.com/users/alice#main-key',
      algorithm: 'rsa-sha256',
      signedHeaders: ['(request-target)', 'host', 'date', 'digest'],
      signature: 'YWJj',
    });
  });

  it('defaults the header list to date when none is given', () => {
    const parsed = service.parseSignatureHeader('keyId="k",signature="s"');
    expect(parsed.signedHeaders).toEqual(['date']);
  });

  it('tolerates whitespace around segments and single quotes', () => {
    const parsed = service.parseSignatureHeader(
      '  keyId = "k" , algorithm="rsa-sha256", headers="date host" , signature="s"  '
    );
    expect(parsed.keyId).toBe('k');
    expect(parsed.signedHeaders).toEqual(['date', 'host']);
  });

  it('returns null for missing, empty, or keyId-less headers', () => {
    expect(service.parseSignatureHeader(undefined)).toBeNull();
    expect(service.parseSignatureHeader(null)).toBeNull();
    expect(service.parseSignatureHeader('')).toBeNull();
    expect(service.parseSignatureHeader('garbage')).toBeNull();
    expect(service.parseSignatureHeader('algorithm="rsa-sha256",signature="s"')).toBeNull();
    expect(service.parseSignatureHeader('keyId="k"')).toBeNull();
  });
});

describe('verifyRequestSignature', () => {
  const actorUrl = 'https://example.com/users/alice';
  const inboxUrl = 'https://example.com/inbox';
  let body: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    const svc = await initialized();
    body = JSON.stringify({ type: 'Create', actor: actorUrl });
    headers = svc.getSignedPostHeaders(actorUrl, body, inboxUrl);
  });

  it('accepts a signature this service produced', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result).toEqual({ valid: true });
  });

  it('accepts the same signature when the body is a string', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: body,
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);
    const tampered = JSON.stringify({ type: 'Create', actor: actorUrl, content: 'injected' });

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: Buffer.from(tampered, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Digest');
  });

  it('rejects a tampered request line', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/somewhere/else',
      headers: { ...headers },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature does not match');
  });

  it('rejects a tampered Date header', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers, Date: new Date(Date.now() + 60_000).toUTCString() },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
  });

  it('rejects a signature made with a different key', () => {
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem: other.publicKey as string,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature does not match');
  });

  it('rejects when a signed header is absent from the request', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);
    const withoutDigest = { ...headers };
    delete (withoutDigest as any).Digest;

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: withoutDigest,
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('absent from the request');
  });

  it('rejects a body carrying a Digest that was not signed', () => {
    const unsignedDigest = {
      ...headers,
      Signature: headers.Signature.replace(' date digest', ' date'),
    };
    // The parsed header must come from the signature actually on the request.
    const parsed = service.parseSignatureHeader(unsignedDigest.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: unsignedDigest,
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
  });

  it('rejects an unsupported algorithm', () => {
    const parsed = {
      keyId: `${actorUrl}#main-key`,
      algorithm: 'hmac-sha256',
      signedHeaders: ['date'],
      signature: 'AAAA',
    };

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unsupported algorithm');
  });

  it('rejects the (created)/(expires) pseudo-headers we do not support', () => {
    const parsed = {
      keyId: `${actorUrl}#main-key`,
      algorithm: 'rsa-sha256',
      signedHeaders: ['(created)'],
      signature: 'AAAA',
    };

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers },
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('pseudo-header');
  });

  it('joins array header values before verifying', () => {
    const parsed = service.parseSignatureHeader(headers.Signature);

    const result = service.verifyRequestSignature({
      method: 'POST',
      path: '/inbox',
      headers: { ...headers, 'X-Multi': ['a', 'b'] } as any,
      rawBody: Buffer.from(body, 'utf8'),
      publicKeyPem,
      parsed,
    });

    expect(result.valid).toBe(true);
  });
});

describe('isInboundVerificationRequired', () => {
  it('defaults to required when federation is enabled', () => {
    expect(makeService({ FEDERATION_ENABLED: 'true' }).isInboundVerificationRequired()).toBe(true);
  });

  it('defaults to not required when federation is disabled', () => {
    expect(makeService({ FEDERATION_ENABLED: 'false' }).isInboundVerificationRequired()).toBe(
      false
    );
    expect(makeService({}).isInboundVerificationRequired()).toBe(false);
  });

  it('honours an explicit override in both directions', () => {
    expect(
      makeService({
        FEDERATION_ENABLED: 'true',
        FEDERATION_VERIFY_INBOUND: 'false',
      }).isInboundVerificationRequired()
    ).toBe(false);
    expect(
      makeService({
        FEDERATION_ENABLED: 'false',
        FEDERATION_VERIFY_INBOUND: 'true',
      }).isInboundVerificationRequired()
    ).toBe(true);
  });
});

describe('assertSafeRemoteUrl', () => {
  it('accepts a public https URL', async () => {
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);

    expect(await service.assertSafeRemoteUrl('https://example.com/users/alice')).toBe(
      'https://example.com/users/alice'
    );
  });

  it('rejects non-https schemes', async () => {
    expect(await service.assertSafeRemoteUrl('http://example.com/a')).toBeNull();
    expect(await service.assertSafeRemoteUrl('file:///etc/passwd')).toBeNull();
    expect(await service.assertSafeRemoteUrl('gopher://example.com')).toBeNull();
  });

  it('rejects credentials embedded in the URL', async () => {
    expect(await service.assertSafeRemoteUrl('https://user:pass@example.com/a')).toBeNull();
  });

  it('rejects loopback, link-local, and metadata hostnames', async () => {
    expect(await service.assertSafeRemoteUrl('https://localhost/a')).toBeNull();
    expect(await service.assertSafeRemoteUrl('https://api.localhost/a')).toBeNull();
    expect(await service.assertSafeRemoteUrl('https://thing.local/a')).toBeNull();
    expect(await service.assertSafeRemoteUrl('https://metadata.google.internal/a')).toBeNull();
  });

  it('rejects private and reserved IP literals', async () => {
    for (const address of [
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '224.0.0.1',
      '255.255.255.255',
      '[::1]',
      '[::]',
      '[fc00::1]',
      '[fe80::1]',
    ]) {
      expect(await service.assertSafeRemoteUrl(`https://${address}/a`)).toBeNull();
    }
  });

  it('rejects an IPv4-mapped IPv6 loopback', async () => {
    expect(await service.assertSafeRemoteUrl('https://[::ffff:127.0.0.1]/a')).toBeNull();
  });

  it('accepts a public IP literal', async () => {
    expect(await service.assertSafeRemoteUrl('https://93.184.216.34/a')).toBe(
      'https://93.184.216.34/a'
    );
  });

  it('accepts 172.15 and 172.32 (just outside RFC1918)', async () => {
    expect(await service.assertSafeRemoteUrl('https://172.15.0.1/a')).not.toBeNull();
    expect(await service.assertSafeRemoteUrl('https://172.32.0.1/a')).not.toBeNull();
  });

  it('rejects a public hostname that resolves to a private address', async () => {
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ] as any);

    // Any private answer rejects the whole host: a rebinding attacker controls
    // only the second answer.
    expect(await service.assertSafeRemoteUrl('https://rebind.example/a')).toBeNull();
  });

  it('rejects a hostname that fails to resolve', async () => {
    jest.spyOn(require('dns').promises, 'lookup').mockRejectedValue(new Error('ENOTFOUND'));

    expect(await service.assertSafeRemoteUrl('https://nx.example/a')).toBeNull();
  });

  it('rejects an unparseable URL', async () => {
    expect(await service.assertSafeRemoteUrl('not a url')).toBeNull();
  });
});

describe('fetchActorPublicKey', () => {
  it('returns the actor public key PEM', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    const getSpy = jest.spyOn(axios as any, 'get').mockResolvedValue({
      data: { id: 'https://example.com/users/alice', publicKey: { publicKeyPem } },
    });

    const pem = await svc.fetchActorPublicKey(
      'https://example.com/users/alice',
      'https://example.com/users/alice'
    );

    expect(pem).toBe(publicKeyPem);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy.mock.calls[0][0]).toBe('https://example.com/users/alice');
  });

  it('accepts a JSON string body', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: JSON.stringify({ publicKey: { publicKeyPem } }) });

    expect(
      await svc.fetchActorPublicKey(
        'https://example.com/users/alice',
        'https://example.com/users/alice'
      )
    ).toBe(publicKeyPem);
  });

  it('refuses to fetch a private address at all', async () => {
    const svc = await initialized();
    const getSpy = jest.spyOn(axios as any, 'get');

    expect(
      await svc.fetchActorPublicKey(
        'https://169.254.169.254/latest/meta-data',
        'https://example.com/u/a'
      )
    ).toBeNull();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('does not follow redirects', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    const getSpy = jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem } } });

    await svc.fetchActorPublicKey(
      'https://example.com/users/alice',
      'https://example.com/users/alice'
    );

    expect((getSpy.mock.calls[0][1] as any).maxRedirects).toBe(0);
  });

  it('returns null when the actor has no usable public key', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    jest.spyOn(axios as any, 'get').mockResolvedValue({ data: { publicKey: {} } });

    expect(
      await svc.fetchActorPublicKey(
        'https://example.com/users/alice',
        'https://example.com/users/alice'
      )
    ).toBeNull();
  });

  it('returns null when the key is not a PEM', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: 'not-a-key' } } });

    expect(
      await svc.fetchActorPublicKey(
        'https://example.com/users/alice',
        'https://example.com/users/alice'
      )
    ).toBeNull();
  });

  it('returns null on a transport error', async () => {
    const svc = await initialized();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    jest.spyOn(axios as any, 'get').mockRejectedValue(new Error('ETIMEDOUT'));

    expect(
      await svc.fetchActorPublicKey(
        'https://example.com/users/alice',
        'https://example.com/users/alice'
      )
    ).toBeNull();
  });
});

describe('full inbound round trip', () => {
  it('verifies a signature produced by a different (remote) key pair', async () => {
    const remote = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const remotePub = remote.publicKey as string;
    const remotePriv = remote.privateKey as string;

    const actorUrl = 'https://mastodon.example/users/alice';
    const body = JSON.stringify({
      type: 'Create',
      actor: actorUrl,
      object: { id: 'x', content: 'hi' },
    });
    const date = new Date().toUTCString();
    const digest = digestOf(body);
    const signingString = [
      '(request-target): post /inbox',
      'host: zynkra.test',
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n');
    const signature = crypto
      .createSign('rsa-sha256')
      .update(signingString, 'utf8')
      .sign(remotePriv, 'base64');

    const header =
      `keyId="${actorUrl}#main-key",algorithm="rsa-sha256",` +
      `headers="(request-target) host date digest",signature="${signature}"`;

    const svc = await initialized();
    const parsed = svc.parseSignatureHeader(header);

    expect(
      svc.verifyRequestSignature({
        method: 'POST',
        path: '/inbox',
        headers: { host: 'zynkra.test', date, digest, Signature: header },
        rawBody: Buffer.from(body, 'utf8'),
        publicKeyPem: remotePub,
        parsed,
      })
    ).toEqual({ valid: true });
  });
});

describe('getActorPublicKey — remote key cache', () => {
  const ACTOR = 'https://mastodon.example/users/alice';

  beforeEach(() => {
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function keyFetchReturning(pem: string) {
    return jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: pem } } });
  }

  it('serves a fresh key from cache without a second fetch', async () => {
    const svc = await initialized();
    const getSpy = keyFetchReturning(publicKeyPem);

    expect(await svc.getActorPublicKey(ACTOR)).toBe(publicKeyPem);
    expect(await svc.getActorPublicKey(ACTOR)).toBe(publicKeyPem);

    // One live round trip per key, not one per inbox request.
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches after the positive TTL expires', async () => {
    jest.useFakeTimers();
    const svc = await initialized();
    const getSpy = keyFetchReturning(publicKeyPem);

    await svc.getActorPublicKey(ACTOR);
    jest.advanceTimersByTime(601_000); // past the 600s positive TTL
    await svc.getActorPublicKey(ACTOR);

    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used entry at capacity', async () => {
    const svc = makeService({ FEDERATION_KEY_CACHE_MAX: '2' });
    await svc.initialize();
    const getSpy = keyFetchReturning(publicKeyPem);
    const a = 'https://a.example/users/a';
    const b = 'https://b.example/users/b';
    const c = 'https://c.example/users/c';

    await svc.getActorPublicKey(a); // fetch 1 — cache: a
    await svc.getActorPublicKey(b); // fetch 2 — cache: a, b
    await svc.getActorPublicKey(a); // hit — recency touch — cache: b, a
    await svc.getActorPublicKey(c); // fetch 3 — evicts b (LRU), cache: a, c
    expect(getSpy).toHaveBeenCalledTimes(3);

    await svc.getActorPublicKey(a); // still resident
    expect(getSpy).toHaveBeenCalledTimes(3);

    await svc.getActorPublicKey(b); // was evicted — fetch 4
    expect(getSpy).toHaveBeenCalledTimes(4);
  });

  it('negative-caches a failed fetch and retries after the negative TTL', async () => {
    const svc = await initialized();
    const getSpy = jest.spyOn(axios as any, 'get').mockRejectedValue(new Error('ETIMEDOUT'));

    expect(await svc.getActorPublicKey(ACTOR)).toBeNull();
    // Within the negative TTL a dead actor costs zero network — this is what
    // stops every request from a broken peer re-triggering a doomed fetch.
    expect(await svc.getActorPublicKey(ACTOR)).toBeNull();
    expect(getSpy).toHaveBeenCalledTimes(1);

    jest.useFakeTimers();
    jest.advanceTimersByTime(46_000); // past the 45s negative TTL
    expect(await svc.getActorPublicKey(ACTOR)).toBeNull();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent misses into a single fetch', async () => {
    const svc = await initialized();
    let resolveFetch: (value: any) => void = () => undefined;
    const getSpy = jest.spyOn(axios as any, 'get').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const first = svc.getActorPublicKey(ACTOR);
    const second = svc.getActorPublicKey(ACTOR);
    // Let the async SSRF-guard chain reach axios.get before resolving it.
    await new Promise((resolve) => setImmediate(resolve));
    resolveFetch({ data: { publicKey: { publicKeyPem } } });

    expect(await first).toBe(publicKeyPem);
    expect(await second).toBe(publicKeyPem);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('refresh bypasses the cache', async () => {
    const svc = await initialized();
    const getSpy = keyFetchReturning(publicKeyPem);

    await svc.getActorPublicKey(ACTOR);
    await svc.getActorPublicKey(ACTOR, { refresh: true });

    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});

describe('verifyInboundRequest — rate limits', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const request = (svc: any, remoteIp: string) =>
    svc.verifyInboundRequest({
      method: 'POST',
      path: '/inbox',
      headers: {},
      rawBody: null,
      activity: {},
      remoteIp,
    });

  it('throws 429 with a Retry-After delay once the per-IP budget is exceeded', async () => {
    const svc = makeService({ FEDERATION_INBOX_IP_PER_MIN: '3' });
    await svc.initialize();

    await request(svc, '203.0.113.1');
    await request(svc, '203.0.113.1');
    await request(svc, '203.0.113.1');

    const error = await request(svc, '203.0.113.1').catch((e: unknown) => e);
    // A subclass of HttpException: guards and filters keep matching on 429,
    // and the filter writes `retryAfterSeconds` as the Retry-After header.
    expect(error).toBeInstanceOf(InboxRateLimitException);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as InboxRateLimitException).retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('isolates the per-IP budget across remotes', async () => {
    const svc = makeService({ FEDERATION_INBOX_IP_PER_MIN: '2' });
    await svc.initialize();

    await request(svc, '203.0.113.1');
    await request(svc, '203.0.113.1');
    await expect(request(svc, '203.0.113.1')).rejects.toBeInstanceOf(InboxRateLimitException);

    // A different remote starts on its own allowance — one noisy neighbour
    // must not close the inbox for everyone behind other addresses.
    await expect(request(svc, '203.0.113.2')).resolves.toBeUndefined();
  });

  it('resets budgets when the window rolls over', async () => {
    jest.useFakeTimers();
    const svc = makeService({ FEDERATION_INBOX_IP_PER_MIN: '2' });
    await svc.initialize();

    await request(svc, '203.0.113.1');
    await request(svc, '203.0.113.1');
    await expect(request(svc, '203.0.113.1')).rejects.toBeInstanceOf(InboxRateLimitException);

    jest.advanceTimersByTime(60_001);
    await expect(request(svc, '203.0.113.1')).resolves.toBeUndefined();
  });

  it('caps outbound key fetches per IP while cached traffic stays free', async () => {
    const remote = generateRemotePair();
    const svc = makeService({
      FEDERATION_VERIFY_INBOUND: 'true',
      FEDERATION_INBOX_IP_PER_MIN: '1000',
      FEDERATION_INBOX_ACTOR_PER_MIN: '1000',
      FEDERATION_KEY_FETCH_IP_PER_MIN: '3',
    });
    await svc.initialize();
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    const getSpy = jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: remote.publicKey } } });

    const validActor = 'https://one.example/users/a';
    const ip = '198.51.100.55';
    const valid = inboxRequest(validActor, remote.privateKey, { remoteIp: ip });

    await expect(svc.verifyInboundRequest(valid)).resolves.toBeUndefined(); // fetch 1
    await expect(svc.verifyInboundRequest(valid)).resolves.toBeUndefined(); // cache — no fetch

    // Each *new* actor from the same IP costs one outbound fetch; garbage
    // signatures still spend the miss budget, because the fetch happens before
    // verification. The valid fetch already consumed one of the three.
    await expect(
      svc.verifyInboundRequest(garbageSignatureRequest('https://g1.example/users/g', ip))
    ).rejects.toThrow('Invalid HTTP Signature'); // fetch 2
    await expect(
      svc.verifyInboundRequest(garbageSignatureRequest('https://g2.example/users/g', ip))
    ).rejects.toThrow('Invalid HTTP Signature'); // fetch 3 — budget now exhausted
    const error = await svc
      .verifyInboundRequest(garbageSignatureRequest('https://g3.example/users/g', ip))
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InboxRateLimitException);
    expect(getSpy).toHaveBeenCalledTimes(3);

    // Cached, already-resolved actors never touch the miss budget: the valid
    // request verifies straight from the cache with no additional fetch.
    await expect(svc.verifyInboundRequest(valid)).resolves.toBeUndefined();
    expect(getSpy).toHaveBeenCalledTimes(3);
  });
});

describe('verifyInboundRequest — signature verification and rotation', () => {
  beforeEach(() => {
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  });

  const ACTOR = 'https://mastodon.example/users/bob';

  it('rejects a request with no signature header', async () => {
    const svc = makeService({ FEDERATION_VERIFY_INBOUND: 'true' });
    await svc.initialize();

    await expect(
      svc.verifyInboundRequest({
        method: 'POST',
        path: '/inbox',
        headers: {},
        rawBody: null,
        activity: {},
        remoteIp: '198.51.100.9',
      })
    ).rejects.toThrow('Missing or malformed HTTP Signature header');
  });

  it('rejects an activity whose actor does not match the signing keyId', async () => {
    const remote = generateRemotePair();
    const svc = makeService({ FEDERATION_VERIFY_INBOUND: 'true' });
    await svc.initialize();
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: remote.publicKey } } });

    const request = inboxRequest(ACTOR, remote.privateKey);
    request.activity = { ...request.activity, actor: 'https://mastodon.example/users/mallory' };

    await expect(svc.verifyInboundRequest(request)).rejects.toThrow(
      'Activity actor does not match the signing keyId'
    );
  });

  it('rejects when the signing actor key cannot be resolved', async () => {
    const remote = generateRemotePair();
    const svc = makeService({ FEDERATION_VERIFY_INBOUND: 'true' });
    await svc.initialize();
    jest.spyOn(axios as any, 'get').mockResolvedValue({ data: { publicKey: {} } });

    await expect(svc.verifyInboundRequest(inboxRequest(ACTOR, remote.privateKey))).rejects.toThrow(
      'Could not resolve the signing actor public key'
    );
  });

  it('re-fetches a stale cached key once and accepts a rotated signature', async () => {
    const oldPair = generateRemotePair();
    const newPair = generateRemotePair();
    const svc = makeService({ FEDERATION_VERIFY_INBOUND: 'true' });
    await svc.initialize();
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValueOnce({ data: { publicKey: { publicKeyPem: oldPair.publicKey } } })
      .mockResolvedValueOnce({ data: { publicKey: { publicKeyPem: newPair.publicKey } } });

    // The peer signs with its *new* key; our (cold) fetch still returns the old
    // one. There is nothing cached to refresh, so this first delivery fails.
    const request = inboxRequest(ACTOR, newPair.privateKey);
    await expect(svc.verifyInboundRequest(request)).rejects.toThrow('Invalid HTTP Signature');
    expect((axios.get as jest.Mock).mock.calls).toHaveLength(1);

    // Second delivery: the stale key is served from cache, verification fails,
    // and exactly one refresh re-fetches the published (rotated) key — which
    // then verifies. Without this, peers would401 until the positive TTL aged out.
    await expect(svc.verifyInboundRequest(request)).resolves.toBeUndefined();
    expect((axios.get as jest.Mock).mock.calls).toHaveLength(2);
  });

  it('keeps rejecting when the refreshed key still does not verify', async () => {
    const oldPair = generateRemotePair();
    const newPair = generateRemotePair();
    const svc = makeService({ FEDERATION_VERIFY_INBOUND: 'true' });
    await svc.initialize();
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: oldPair.publicKey } } });

    const request = inboxRequest(ACTOR, newPair.privateKey);
    await expect(svc.verifyInboundRequest(request)).rejects.toThrow(
      'Invalid HTTP Signature: signature does not match'
    );
    await expect(svc.verifyInboundRequest(request)).rejects.toThrow(
      'Invalid HTTP Signature: signature does not match'
    );
    // The rotation attempt still cost exactly one extra fetch...
    expect((axios.get as jest.Mock).mock.calls).toHaveLength(2);
  });
});

describe('FederationExceptionFilter', () => {
  function makeHost() {
    const response = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as any;
    return { host, response };
  }

  it('writes Retry-After on inbox rate-limit rejections', () => {
    const { host, response } = makeHost();
    const filter = new FederationExceptionFilter();

    filter.catch(new InboxRateLimitException(37, 'Rate limit exceeded'), host);

    expect(response.set).toHaveBeenCalledWith('Retry-After', '37');
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 429, message: 'Rate limit exceeded' })
    );
  });

  it('leaves ordinary HttpExceptions exactly as Nest would write them', () => {
    const { host, response } = makeHost();
    const filter = new FederationExceptionFilter();

    filter.catch(new HttpException('nope', 401), host);

    expect(response.set).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith('nope');
  });

  it('answers unknown errors with a 500', () => {
    const { host, response } = makeHost();
    const filter = new FederationExceptionFilter();

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' })
    );
  });
});
