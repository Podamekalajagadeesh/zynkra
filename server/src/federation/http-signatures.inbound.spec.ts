import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { HttpSignaturesService } from './http-signatures.service';

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
    findOne: jest.fn().mockResolvedValue({ isActive: true, privateKey: privateKeyPem, publicKey: publicKeyPem }),
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
      'keyId="https://example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="YWJj"',
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
      '  keyId = "k" , algorithm="rsa-sha256", headers="date host" , signature="s"  ',
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
    const parsed = service.parseSignatureHeader(headers.Signature);
    const unsignedDigest = { ...headers, Signature: headers.Signature.replace(' date digest', ' date') };

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
    expect(makeService({ FEDERATION_ENABLED: 'false' }).isInboundVerificationRequired()).toBe(false);
    expect(makeService({}).isInboundVerificationRequired()).toBe(false);
  });

  it('honours an explicit override in both directions', () => {
    expect(
      makeService({ FEDERATION_ENABLED: 'true', FEDERATION_VERIFY_INBOUND: 'false' }).isInboundVerificationRequired(),
    ).toBe(false);
    expect(
      makeService({ FEDERATION_ENABLED: 'false', FEDERATION_VERIFY_INBOUND: 'true' }).isInboundVerificationRequired(),
    ).toBe(true);
  });
});

describe('assertSafeRemoteUrl', () => {
  it('accepts a public https URL', async () => {
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);

    expect(await service.assertSafeRemoteUrl('https://example.com/users/alice')).toBe(
      'https://example.com/users/alice',
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
      'https://93.184.216.34/a',
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
    jest
      .spyOn(require('dns').promises, 'lookup')
      .mockRejectedValue(new Error('ENOTFOUND'));

    expect(await service.assertSafeRemoteUrl('https://nx.example/a')).toBeNull();
  });

  it('rejects an unparseable URL', async () => {
    expect(await service.assertSafeRemoteUrl('not a url')).toBeNull();
  });
});

describe('fetchActorPublicKey', () => {
  it('returns the actor public key PEM', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    const getSpy = jest.spyOn(axios as any, 'get').mockResolvedValue({
      data: { id: 'https://example.com/users/alice', publicKey: { publicKeyPem } },
    });

    const pem = await svc.fetchActorPublicKey(
      'https://example.com/users/alice',
      'https://example.com/users/alice',
    );

    expect(pem).toBe(publicKeyPem);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy.mock.calls[0][0]).toBe('https://example.com/users/alice');
  });

  it('accepts a JSON string body', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: JSON.stringify({ publicKey: { publicKeyPem } }) });

    expect(
      await svc.fetchActorPublicKey('https://example.com/users/alice', 'https://example.com/users/alice'),
    ).toBe(publicKeyPem);
  });

  it('refuses to fetch a private address at all', async () => {
    const svc = await initialized();
    const getSpy = jest.spyOn(axios as any, 'get');

    expect(
      await svc.fetchActorPublicKey('https://169.254.169.254/latest/meta-data', 'https://example.com/u/a'),
    ).toBeNull();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('does not follow redirects', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    const getSpy = jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem } } });

    await svc.fetchActorPublicKey('https://example.com/users/alice', 'https://example.com/users/alice');

    expect(getSpy.mock.calls[0][1].maxRedirects).toBe(0);
  });

  it('returns null when the actor has no usable public key', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    jest.spyOn(axios as any, 'get').mockResolvedValue({ data: { publicKey: {} } });

    expect(
      await svc.fetchActorPublicKey('https://example.com/users/alice', 'https://example.com/users/alice'),
    ).toBeNull();
  });

  it('returns null when the key is not a PEM', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    jest
      .spyOn(axios as any, 'get')
      .mockResolvedValue({ data: { publicKey: { publicKeyPem: 'not-a-key' } } });

    expect(
      await svc.fetchActorPublicKey('https://example.com/users/alice', 'https://example.com/users/alice'),
    ).toBeNull();
  });

  it('returns null on a transport error', async () => {
    const svc = await initialized();
    jest.spyOn(require('dns').promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
    jest.spyOn(axios as any, 'get').mockRejectedValue(new Error('ETIMEDOUT'));

    expect(
      await svc.fetchActorPublicKey('https://example.com/users/alice', 'https://example.com/users/alice'),
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
    const body = JSON.stringify({ type: 'Create', actor: actorUrl, object: { id: 'x', content: 'hi' } });
    const date = new Date().toUTCString();
    const digest = digestOf(body);
    const signingString = [
      '(request-target): post /inbox',
      'host: zynkra.test',
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n');
    const signature = crypto.createSign('rsa-sha256')
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
      }),
    ).toEqual({ valid: true });
  });
});
