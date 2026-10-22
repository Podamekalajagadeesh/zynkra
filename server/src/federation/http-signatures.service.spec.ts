import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { HttpSignaturesService } from './http-signatures.service';

let service: any;
let publicKeyPem: string;
let privateKeyPem: string;
let instanceKeyRepository: any;

function digestOf(body: string): string {
  return `SHA-256=${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;
}

function signatureValue(signatureHeader: string): string {
  const match = /signature="([^"]+)"/.exec(signatureHeader);
  if (!match) throw new Error(`No signature in header: ${signatureHeader}`);
  return match[1];
}

function verify(signingString: string, signature: string): boolean {
  return crypto.verify(
    'sha256',
    Buffer.from(signingString, 'utf8'),
    publicKeyPem,
    Buffer.from(signature, 'base64')
  );
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
  service = new (HttpSignaturesService as any)(instanceKeyRepository);
});

describe('initialize', () => {
  it('loads an existing active key instead of generating a new one', async () => {
    await service.initialize();

    expect(instanceKeyRepository.findOne).toHaveBeenCalledWith({ where: { isActive: true } });
    expect(instanceKeyRepository.save).not.toHaveBeenCalled();
    expect(service.getPublicKeyPem()).toBe(publicKeyPem);
  });

  it('generates and persists a keypair when the instance has none', async () => {
    instanceKeyRepository.findOne.mockResolvedValue(null);

    await service.initialize();

    expect(instanceKeyRepository.create).toHaveBeenCalledTimes(1);
    expect(instanceKeyRepository.save).toHaveBeenCalledTimes(1);
    const saved = instanceKeyRepository.create.mock.calls[0][0];
    expect(saved.isActive).toBe(true);
    expect(saved.privateKey).toContain('PRIVATE KEY');
    expect(saved.publicKey).toContain('PUBLIC KEY');
    expect(service.getPublicKeyPem()).toBe(saved.publicKey);
  }, 60000);
});

describe('pre-initialization guards', () => {
  it('refuses to expose a public key before initialize()', () => {
    expect(() => service.getPublicKeyPem()).toThrow('Instance key not initialized');
  });

  it('refuses to sign before initialize()', () => {
    expect(() => service.signRequest('POST', '/inbox', 'example.com', 'body', 'keyId')).toThrow(
      'Instance key not initialized'
    );
  });
});

describe('getSignedPostHeaders', () => {
  const actorUrl = 'https://zynkra.test/federation/users/alice';
  const inboxUrl = 'https://example.com/users/bob/inbox';
  const body = JSON.stringify({ type: 'Create', actor: actorUrl });

  beforeEach(async () => {
    await service.initialize();
  });

  it('produces a signature a remote server can verify', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, inboxUrl);

    const signingString = [
      '(request-target): post /users/bob/inbox',
      'host: example.com',
      `date: ${headers.Date}`,
      `digest: ${headers.Digest}`,
    ].join('\n');

    expect(verify(signingString, signatureValue(headers.Signature))).toBe(true);
  });

  it('signs the exact body it advertises in the Digest header', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, inboxUrl);
    expect(headers.Digest).toBe(digestOf(body));
  });

  it('fails verification if the body is altered in transit', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, inboxUrl);
    const tampered = JSON.stringify({ type: 'Create', actor: actorUrl, content: 'injected' });

    const signingString = [
      '(request-target): post /users/bob/inbox',
      'host: example.com',
      `date: ${headers.Date}`,
      `digest: ${digestOf(tampered)}`,
    ].join('\n');

    expect(headers.Digest).not.toBe(digestOf(tampered));
    expect(verify(signingString, signatureValue(headers.Signature))).toBe(false);
  });

  it('fails verification if the signing string is altered in transit', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, inboxUrl);
    const signingString = [
      '(request-target): post /users/carol/inbox',
      'host: example.com',
      `date: ${headers.Date}`,
      `digest: ${headers.Digest}`,
    ].join('\n');

    expect(verify(signingString, signatureValue(headers.Signature))).toBe(false);
  });

  it('emits a draft-cavage-10 shaped Signature header', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, inboxUrl);

    expect(headers.Signature).toContain(`keyId="${actorUrl}#main-key"`);
    expect(headers.Signature).toContain('algorithm="rsa-sha256"');
    expect(headers.Signature).toContain('headers="(request-target) host date digest"');
    expect(headers['Content-Type']).toBe('application/activity+json');
    expect(headers.Host).toBe('example.com');
  });

  it('includes the port in the signed host when the URL has one', () => {
    const headers = service.getSignedPostHeaders(actorUrl, body, 'http://example.com:8080/inbox');
    expect(headers.Host).toBe('example.com:8080');

    const signingString = [
      '(request-target): post /inbox',
      'host: example.com:8080',
      `date: ${headers.Date}`,
      `digest: ${headers.Digest}`,
    ].join('\n');

    expect(verify(signingString, signatureValue(headers.Signature))).toBe(true);
  });
});

describe('getSignedGetHeaders', () => {
  const actorUrl = 'https://zynkra.test/federation/users/alice';

  beforeEach(async () => {
    await service.initialize();
  });

  it('signs the request line with query string and omits the digest', () => {
    const target = 'https://example.com/users/bob?page=2';
    const headers = service.getSignedGetHeaders(actorUrl, target);

    expect(headers.Digest).toBeUndefined();
    expect(headers.Signature).toContain('headers="(request-target) host date"');

    const signingString = [
      '(request-target): get /users/bob?page=2',
      'host: example.com',
      `date: ${headers.Date}`,
    ].join('\n');

    expect(verify(signingString, signatureValue(headers.Signature))).toBe(true);
  });

  it('fails verification if the query string is altered', () => {
    const headers = service.getSignedGetHeaders(actorUrl, 'https://example.com/users/bob?page=2');

    const signingString = [
      '(request-target): get /users/bob?page=999',
      'host: example.com',
      `date: ${headers.Date}`,
    ].join('\n');

    expect(verify(signingString, signatureValue(headers.Signature))).toBe(false);
  });
});
