import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanceKey } from './entities/instance-key.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { promises as dns } from 'dns';
import { isIP } from 'net';
import axios from 'axios';

function safeJsonParse(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * True for loopback, RFC1918, link-local, unique-local, and reserved ranges.
 * Used to keep attacker-controlled `keyId` URLs from becoming an SSRF primitive.
 */
function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().split('%')[0];

  if (ip === '::1' || ip === '::') return true;
  if (ip === '0.0.0.0') return true;

  // IPv4-mapped/compatible IPv6 (::ffff:127.0.0.1)
  const mapped = /^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
  if (mapped) return isPrivateAddress(mapped[1]);

  if (isIP(ip) === 4) {
    const octets = ip.split('.').map(Number);
    if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
      return true;
    }
    const [a, b] = octets;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved + broadcast
    return false;
  }

  // fc00::/7 unique-local, fe80::/10 link-local
  if (/^f[cd]/.test(ip)) return true;
  if (/^fe[89ab]/.test(ip)) return true;

  return false;
}

/**
 * HTTP Signatures service (draft-cavage-http-signatures-10).
 *
 * Mastodon, Pixelfed, and most ActivityPub implementations require
 * outgoing POST requests to carry an HTTP Signature header proving
 * the sender controls the actor's private key. This service:
 *
 *  1. Generates an RSA key pair for the instance on first use
 *  2. Signs outgoing requests with RSA-SHA256
 *  3. Adds the required Digest header for POST bodies
 *  4. Verifies *inbound* signatures (added when the signed-inbox gap was closed)
 */
@Injectable()
export class HttpSignaturesService {
  private readonly logger = new Logger(HttpSignaturesService.name);
  private cachedPrivateKey: string | null = null;
  private cachedPublicKey: string | null = null;

  constructor(
    @InjectRepository(InstanceKey)
    private readonly instanceKeyRepository: Repository<InstanceKey>,
    private readonly configService?: ConfigService,
  ) {}

  /**
   * Whether inbound activities must carry a valid HTTP Signature.
   *
   * Defaults to **on** whenever `FEDERATION_ENABLED=true`. An instance that
   * federates should not accept unsigned activities, because a forged `Follow`
   * or `Create` is indistinguishable from a real one once it is persisted.
   */
  isInboundVerificationRequired(): boolean {
    const flag = this.configService?.get<string>('FEDERATION_VERIFY_INBOUND');
    if (flag !== undefined && flag !== null && flag !== '') return flag === 'true';
    return this.configService?.get<string>('FEDERATION_ENABLED', 'false') === 'true';
  }

  /**
   * Ensure an instance key exists. Called once at boot.
   */
  async initialize(): Promise<void> {
    const activeKey = await this.instanceKeyRepository.findOne({
      where: { isActive: true },
    });

    if (activeKey) {
      this.cachedPrivateKey = activeKey.privateKey;
      this.cachedPublicKey = activeKey.publicKey;
      this.logger.log('Instance key loaded from database');
      return;
    }

    this.logger.log('Generating new RSA instance key pair...');
    const { privateKey, publicKey } = await this.generateKeyPair();

    const key = this.instanceKeyRepository.create({
      privateKey,
      publicKey,
      isActive: true,
    });
    await this.instanceKeyRepository.save(key);

    this.cachedPrivateKey = privateKey;
    this.cachedPublicKey = publicKey;
    this.logger.log('Instance key pair generated and stored');
  }

  /**
   * Generate a 4096-bit RSA key pair.
   */
  private generateKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        'rsa',
        {
          modulusLength: 4096,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        },
        (err, publicKey, privateKey) => {
          if (err) reject(err);
          else resolve({ privateKey, publicKey });
        },
      );
    });
  }

  /**
   * Get the instance's public key in PEM format.
   */
  getPublicKeyPem(): string {
    if (!this.cachedPublicKey) {
      throw new Error('Instance key not initialized');
    }
    return this.cachedPublicKey;
  }

  /**
   * Build the `Signature` header value for an ActivityPub request.
   *
   * Follows draft-cavage-http-signatures-10 with the required headers:
   *  - (request-target): "post /path"
   *  - host: the target host
   *  - date: current date in HTTP format
   *  - digest: SHA-256 hash of body (for POST)
   */
  signRequest(
    method: string,
    path: string,
    host: string,
    body: string | null,
    actorKeyId: string,
  ): {
    signatureHeader: string;
    digestHeader: string | null;
    dateHeader: string;
  } {
    if (!this.cachedPrivateKey) {
      throw new Error('Instance key not initialized — call initialize() first');
    }

    const dateHeader = new Date().toUTCString();
    let digestHeader: string | null = null;
    const signedHeaders: string[] = ['(request-target)', 'host', 'date'];

    // Build the signing string
    let signingString = '';
    signingString += `(request-target): ${method.toLowerCase()} ${path}\n`;
    signingString += `host: ${host}\n`;
    signingString += `date: ${dateHeader}\n`;

    // For POST requests, include the digest
    if (body && method.toUpperCase() === 'POST') {
      const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
      digestHeader = `SHA-256=${bodyHash}`;
      signingString += `digest: ${digestHeader}\n`;
      signedHeaders.push('digest');
    }

    // Remove trailing newline
    signingString = signingString.trimEnd();

    // Sign with RSA-SHA256
    const signer = crypto.createSign('rsa-sha256');
    signer.update(signingString, 'utf8');
    const signature = signer.sign(this.cachedPrivateKey, 'base64');

    // Build the Signature header
    const signatureHeader = [
      `keyId="${actorKeyId}"`,
      'algorithm="rsa-sha256"',
      `headers="${signedHeaders.join(' ')}"`,
      `signature="${signature}"`,
    ].join(',');

    return { signatureHeader, digestHeader, dateHeader };
  }

  /**
   * Get the Axios headers needed for an ActivityPub POST request.
   *
   * @param actorUrl - The actor's ActivityPub ID (used as keyId)
   * @param body - The JSON request body as a string
   * @param inboxUrl - The target inbox URL
   */
  getSignedPostHeaders(
    actorUrl: string,
    body: string,
    inboxUrl: string,
  ): Record<string, string> {
    const url = new URL(inboxUrl);
    const path = url.pathname;
    const host = url.hostname + (url.port ? `:${url.port}` : '');
    const keyId = `${actorUrl}#main-key`;

    const { signatureHeader, digestHeader, dateHeader } = this.signRequest(
      'POST',
      path,
      host,
      body,
      keyId,
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/activity+json',
      'Host': host,
      'Date': dateHeader,
      'Signature': signatureHeader,
      'Accept': 'application/activity+json, application/ld+json',
    };

    if (digestHeader) {
      headers['Digest'] = digestHeader;
    }

    return headers;
  }

  /**
   * Parse a `Signature` header into its keyId / algorithm / headers / signature parts.
   * Returns null when the header is absent or malformed.
   */
  parseSignatureHeader(header: string | undefined | null): {
    keyId: string;
    algorithm: string;
    signedHeaders: string[];
    signature: string;
  } | null {
    if (!header || typeof header !== 'string') return null;

    const parts: Record<string, string> = {};
    for (const segment of header.split(',')) {
      const eq = segment.indexOf('=');
      if (eq === -1) continue;
      const name = segment.slice(0, eq).trim();
      let value = segment.slice(eq + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (name) parts[name] = value;
    }

    if (!parts.keyId || !parts.signature) return null;

    return {
      keyId: parts.keyId,
      algorithm: parts.algorithm || 'rsa-sha256',
      signedHeaders: (parts.headers || 'date').split(/\s+/).filter(Boolean),
      signature: parts.signature,
    };
  }

  /**
   * Rebuild the draft-cavage-10 signing string from the *actual* request headers
   * and verify it against the actor's published public key.
   *
   * `rawBody` must be the exact bytes received — not a re-serialization. This is
   * why the app is created with `rawBody: true`: `JSON.stringify(req.body)` can
   * differ from the wire bytes (key order, unicode escaping, whitespace), and
   * verifying against a re-serialized body would accept a tampered request whose
   * parsed object happens to stringify identically, or reject a legitimate one.
   */
  verifyRequestSignature(params: {
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer | string | null;
    publicKeyPem: string;
    parsed: { keyId: string; algorithm: string; signedHeaders: string[]; signature: string };
  }): { valid: boolean; reason?: string } {
    const { method, path, headers, rawBody, publicKeyPem, parsed } = params;

    if (parsed.algorithm.toLowerCase() !== 'rsa-sha256') {
      return { valid: false, reason: `unsupported algorithm ${parsed.algorithm}` };
    }

    const lower: Record<string, string> = {};
    for (const [name, value] of Object.entries(headers || {})) {
      if (value === undefined) continue;
      lower[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
    }

    const lines: string[] = [];
    for (const name of parsed.signedHeaders) {
      if (name === '(request-target)') {
        lines.push(`(request-target): ${method.toLowerCase()} ${path}`);
        continue;
      }
      if (name === '(created)' || name === '(expires)') {
        return { valid: false, reason: `unsupported pseudo-header ${name}` };
      }
      const value = lower[name];
      if (value === undefined) {
        return { valid: false, reason: `signed header "${name}" is absent from the request` };
      }
      lines.push(`${name}: ${value}`);
    }

    if (lines.length === 0) return { valid: false, reason: 'no signed headers' };

    // A signed digest only means something if it covers the body we received.
    if (rawBody && lower.digest && !parsed.signedHeaders.includes('digest')) {
      return { valid: false, reason: 'request carries a Digest but it was not signed' };
    }
    if (rawBody && lower.digest) {
      const expected = `SHA-256=${crypto
        .createHash('sha256')
        .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
        .digest('base64')}`;
      if (expected !== lower.digest.trim()) {
        return { valid: false, reason: 'Digest does not match the received body' };
      }
    }

    let verified = false;
    try {
      verified = crypto.verify(
        'sha256',
        Buffer.from(lines.join('\n'), 'utf8'),
        publicKeyPem,
        Buffer.from(parsed.signature, 'base64'),
      );
    } catch (error) {
      return { valid: false, reason: `signature verification threw: ${(error as Error).message}` };
    }

    return verified ? { valid: true } : { valid: false, reason: 'signature does not match' };
  }

  /**
   * Fetch an actor's public key PEM over HTTP Signatures.
   *
   * Every outbound request in this file used to be signed, but nothing *verified*
   * what came in. This method is the verification half, and it is deliberately
   * defensive about the URL it will fetch: `keyId` is attacker-controlled, so an
   * unrestricted `axios.get` here is a server-side request forgery primitive that
   * can reach internal addresses and cloud metadata endpoints.
   */
  async fetchActorPublicKey(actorUrl: string, signerActorUrl: string): Promise<string | null> {
    const safe = await this.assertSafeRemoteUrl(actorUrl);
    if (!safe) return null;

    try {
      const signedHeaders = this.getSignedGetHeaders(signerActorUrl, safe);
      const response = await axios.get<string>(safe, {
        headers: { ...signedHeaders, Accept: 'application/activity+json, application/ld+json' },
        timeout: 5000,
        maxRedirects: 0,
      });

      const data = typeof response.data === 'string' ? safeJsonParse(response.data) : response.data;
      const pem = data?.publicKey?.publicKeyPem;

      if (typeof pem !== 'string' || !pem.includes('BEGIN PUBLIC KEY')) return null;
      return pem;
    } catch (error) {
      this.logger.warn(`Failed to fetch public key for ${actorUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Reject URLs that point at non-HTTPS schemes, loopback/private/link-local
   * addresses, or hostnames that resolve to one. Returns the normalized URL, or
   * null if it is unsafe to fetch.
   */
  async assertSafeRemoteUrl(rawUrl: string): Promise<string | null> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return null;
    }

    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;

    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null;
    if (host === 'metadata.google.internal') return null;

    if (isIP(host)) {
      return isPrivateAddress(host) ? null : url.toString();
    }

    let addresses: Array<{ address: string }> = [];
    try {
      addresses = await dns.lookup(host, { all: true });
    } catch {
      return null;
    }
    if (addresses.length === 0) return null;
    if (addresses.some((entry) => isPrivateAddress(entry.address))) return null;

    return url.toString();
  }

  /**
   * Get signed headers for a GET request (used for fetching remote actors, etc.)
   */
  getSignedGetHeaders(
    actorUrl: string,
    targetUrl: string,
  ): Record<string, string> {
    const url = new URL(targetUrl);
    const path = url.pathname + url.search;
    const host = url.hostname + (url.port ? `:${url.port}` : '');
    const keyId = `${actorUrl}#main-key`;

    const { signatureHeader, dateHeader } = this.signRequest(
      'GET',
      path,
      host,
      null,
      keyId,
    );

    return {
      'Host': host,
      'Date': dateHeader,
      'Signature': signatureHeader,
      'Accept': 'application/activity+json, application/ld+json',
    };
  }
}
