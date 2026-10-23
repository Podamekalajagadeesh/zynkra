import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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
 * Inbox budget exhausted for a remote IP, actor, or key-fetch allowance.
 *
 * A subclass of `HttpException` (so callers can still `instanceof` and
 * `getStatus() === 429`), carrying the `Retry-After` delay that the
 * federation exception filter writes as a response header — Nest's stock
 * `HttpException` cannot attach headers, and a peer that receives a bare 429
 * has no idea how long to back off.
 */
export class InboxRateLimitException extends HttpException {
  constructor(
    readonly retryAfterSeconds: number,
    message: string
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

interface ActorKeyCacheEntry {
  /** Cached PEM, or null for a negative entry (the fetch failed). */
  pem: string | null;
  expiresAt: number;
}

interface RateWindow {
  windowStart: number;
  count: number;
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
 *  5. Caches remote actor keys (LRU + TTL + negative cache) and enforces
 *     inbound inbox rate budgets (added when the per-request key fetch and
 *     unbounded inbox became an amplification vector)
 */
@Injectable()
export class HttpSignaturesService {
  private readonly logger = new Logger(HttpSignaturesService.name);
  private cachedPrivateKey: string | null = null;
  private cachedPublicKey: string | null = null;

  /**
   * Remote actor key cache: bounded LRU keyed by actor URL. Insertion order
   * doubles as recency order — a hit or a store re-inserts the entry, so
   * `keys().next()` is always the least recently used. Entries are public keys,
   * so a per-process map needs no cross-instance coherence.
   */
  private readonly actorKeyCache = new Map<string, ActorKeyCacheEntry>();
  /** Single-flight: concurrent misses for one actor share one fetch promise. */
  private readonly actorKeyInflight = new Map<string, Promise<string | null>>();
  /** Fixed 60s windows for the inbox budgets, keyed `scope:subject`. */
  private readonly rateWindows = new Map<string, RateWindow>();

  constructor(
    @InjectRepository(InstanceKey)
    private readonly instanceKeyRepository: Repository<InstanceKey>,
    private readonly configService?: ConfigService
  ) {}

  /** Positive remote-key TTL in ms (default 10 min). */
  private get keyCacheTtlMs(): number {
    return this.numericConfig('FEDERATION_KEY_CACHE_TTL_SECONDS', 600) * 1000;
  }

  /** Negative (failed-fetch) TTL in ms (default 45 s). */
  private get keyCacheNegativeTtlMs(): number {
    return this.numericConfig('FEDERATION_KEY_CACHE_NEGATIVE_TTL_SECONDS', 45) * 1000;
  }

  /** LRU capacity (default 1000). */
  private get keyCacheMax(): number {
    return this.numericConfig('FEDERATION_KEY_CACHE_MAX', 1000);
  }

  private get inboxIpPerMinute(): number {
    return this.numericConfig('FEDERATION_INBOX_IP_PER_MIN', 240);
  }

  private get inboxActorPerMinute(): number {
    return this.numericConfig('FEDERATION_INBOX_ACTOR_PER_MIN', 120);
  }

  private get keyFetchPerMinute(): number {
    return this.numericConfig('FEDERATION_KEY_FETCH_IP_PER_MIN', 30);
  }

  /** Read a positive-integer config value, falling back on absent/invalid input. */
  private numericConfig(key: string, fallback: number): number {
    const raw = this.configService?.get<string | number>(key);
    if (raw === undefined || raw === null || raw === '') return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
  }

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
        }
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
    actorKeyId: string
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
  getSignedPostHeaders(actorUrl: string, body: string, inboxUrl: string): Record<string, string> {
    const url = new URL(inboxUrl);
    const path = url.pathname;
    const host = url.hostname + (url.port ? `:${url.port}` : '');
    const keyId = `${actorUrl}#main-key`;

    const { signatureHeader, digestHeader, dateHeader } = this.signRequest(
      'POST',
      path,
      host,
      body,
      keyId
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/activity+json',
      Host: host,
      Date: dateHeader,
      Signature: signatureHeader,
      Accept: 'application/activity+json, application/ld+json',
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
        Buffer.from(parsed.signature, 'base64')
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
   * Resolve an actor's public key through the local LRU cache.
   *
   * The inbox takes one full SSRF-guarded network round trip per request when
   * this is a plain `fetchActorPublicKey` — on a busy feed that is thousands of
   * outbound GETs a minute for keys that change only on rotation. Cache layers:
   *
   *  - fresh positive entry → return the PEM, zero network
   *  - fresh negative entry → return null, zero network (a dead actor is not
   *    worth re-querying on every post it sends)
   *  - miss/expired → single-flight fetch shared by concurrent callers, then
   *    store positive for 10 min / negative for 45 s
   *  - `refresh: true` → bypass and overwrite; used for key rotation
   */
  async getActorPublicKey(
    actorUrl: string,
    options: { refresh?: boolean } = {}
  ): Promise<string | null> {
    if (!options.refresh) {
      const entry = this.actorKeyCache.get(actorUrl);
      if (entry && entry.expiresAt > Date.now()) {
        // LRU touch: re-insert so this entry becomes the most recently used.
        this.actorKeyCache.delete(actorUrl);
        this.actorKeyCache.set(actorUrl, entry);
        return entry.pem;
      }
    }

    const inflight = this.actorKeyInflight.get(actorUrl);
    if (inflight) return inflight;

    const fetchPromise = (async () => {
      // `fetchActorPublicKey` handles its own failures, but the catch keeps a
      // surprise throw from poisoning the single-flight waiters with a rejection
      // nobody turns into a negative entry.
      const pem = await this.fetchActorPublicKey(actorUrl, actorUrl).catch(() => null);
      const ttlMs = pem ? this.keyCacheTtlMs : this.keyCacheNegativeTtlMs;
      this.storeActorKey(actorUrl, pem, Date.now() + ttlMs);
      return pem;
    })();
    this.actorKeyInflight.set(actorUrl, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.actorKeyInflight.delete(actorUrl);
    }
  }

  /** Store (or overwrite) an entry, evicting least-recently-used beyond capacity. */
  private storeActorKey(actorUrl: string, pem: string | null, expiresAt: number): void {
    this.actorKeyCache.delete(actorUrl);
    while (this.actorKeyCache.size >= this.keyCacheMax) {
      const oldest = this.actorKeyCache.keys().next().value;
      if (oldest === undefined) break;
      this.actorKeyCache.delete(oldest);
    }
    this.actorKeyCache.set(actorUrl, { pem, expiresAt });
  }

  /**
   * Verify an inbound inbox request end to end: rate budgets, signature parse,
   * actor match, key resolution (cached), and verification with a single
   * rotation re-fetch.
   *
   * Everything lives here rather than in the controller because the expensive
   * and abusable parts — outbound key fetches and unauthenticated inbox POSTs —
   * must be budgeted before they run, and only this service sees the cache.
   *
   * Budget order (cheap checks first, network last):
   *   1. per-IP inbox verifications — always, even when verification is off
   *   2. per-actor verifications — one actor cannot starve the inbox
   *   3. per-IP key-fetch misses — hard cap on outbound amplification from
   *      rotating keyIds (cache hits consume none of this)
   *
   * Throws `InboxRateLimitException` (429 + Retry-After) on budget breaches and
   * `HttpException` (401) on verification failures — identical messages to the
   * ones the controller used before this moved in.
   */
  async verifyInboundRequest(params: {
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer | string | null;
    activity: any;
    remoteIp?: string | null;
  }): Promise<void> {
    const remoteIp = params.remoteIp || 'unknown';
    this.consumeBudget('inbox:ip', remoteIp, this.inboxIpPerMinute);

    if (!this.isInboundVerificationRequired()) return;

    // Multiple Signature headers are not a thing; a non-string value (e.g. an
    // array) is treated as absent, exactly as the controller's parse did.
    const rawSignature = params.headers?.signature;
    const parsed = this.parseSignatureHeader(
      typeof rawSignature === 'string' ? rawSignature : undefined
    );
    if (!parsed) {
      throw new HttpException(
        'Missing or malformed HTTP Signature header',
        HttpStatus.UNAUTHORIZED
      );
    }

    // The keyId identifies the signing actor: `https://host/users/alice#main-key`.
    // The fragment is not part of the fetchable URL.
    const actorUrl = parsed.keyId.split('#')[0];
    if (!actorUrl) {
      throw new HttpException('Signature keyId is not a valid actor URL', HttpStatus.UNAUTHORIZED);
    }

    // A signature proves control of the key, not that the activity came from that
    // actor. Without this check, any server with a valid key could attribute its
    // activity to a third party by setting `actor` to someone else's URL.
    if (params.activity?.actor && params.activity.actor !== actorUrl) {
      throw new HttpException(
        'Activity actor does not match the signing keyId',
        HttpStatus.UNAUTHORIZED
      );
    }

    this.consumeBudget('inbox:actor', actorUrl, this.inboxActorPerMinute);

    const cachedEntry = this.actorKeyCache.get(actorUrl);
    const fromFreshCache = !!cachedEntry && cachedEntry.expiresAt > Date.now();
    if (!fromFreshCache) {
      this.consumeBudget('keyfetch:ip', remoteIp, this.keyFetchPerMinute);
    }

    const publicKeyPem = await this.getActorPublicKey(actorUrl);
    if (!publicKeyPem) {
      throw new HttpException(
        'Could not resolve the signing actor public key',
        HttpStatus.UNAUTHORIZED
      );
    }

    const attempt = (pem: string) =>
      this.verifyRequestSignature({
        method: params.method,
        path: params.path,
        headers: params.headers,
        rawBody: params.rawBody,
        publicKeyPem: pem,
        parsed,
      });

    let result = attempt(publicKeyPem);

    // Key rotation: the cached PEM is stale and no longer matches what the peer
    // signs with. Re-fetch once (bypassing the cache) and re-verify against the
    // published key before rejecting — without this, every peer breaks for a
    // full positive TTL the moment they rotate. Only worth trying when the key
    // came from cache: a just-fetched key is already the published one.
    if (!result.valid && fromFreshCache) {
      this.consumeBudget('keyfetch:ip', remoteIp, this.keyFetchPerMinute);
      const refreshed = await this.getActorPublicKey(actorUrl, { refresh: true });
      if (refreshed && refreshed !== publicKeyPem) {
        result = attempt(refreshed);
      }
    }

    if (!result.valid) {
      throw new HttpException(`Invalid HTTP Signature: ${result.reason}`, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Fixed 60s-window budget check. First call in a window opens it; breaching
   * the limit throws 429 with the seconds remaining in the window.
   *
   * The window map is bounded by a sweep of expired windows once it grows past
   * a few thousand keys (many distinct remote IPs), so a flood of unique
   * subjects cannot grow it without limit.
   */
  private consumeBudget(scope: string, subject: string, limit: number): void {
    const now = Date.now();
    const windowMs = 60_000;
    const key = `${scope}:${subject}`;

    if (this.rateWindows.size > 5_000) {
      for (const [k, w] of this.rateWindows) {
        if (now - w.windowStart >= windowMs) this.rateWindows.delete(k);
      }
    }

    let window = this.rateWindows.get(key);
    if (!window || now - window.windowStart >= windowMs) {
      window = { windowStart: now, count: 0 };
      this.rateWindows.set(key, window);
    }

    window.count += 1;
    if (window.count > limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((window.windowStart + windowMs - now) / 1000)
      );
      throw new InboxRateLimitException(
        retryAfterSeconds,
        `Rate limit exceeded for ${scope.replace(':', ' ')} — retry in ${retryAfterSeconds}s`
      );
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
  getSignedGetHeaders(actorUrl: string, targetUrl: string): Record<string, string> {
    const url = new URL(targetUrl);
    const path = url.pathname + url.search;
    const host = url.hostname + (url.port ? `:${url.port}` : '');
    const keyId = `${actorUrl}#main-key`;

    const { signatureHeader, dateHeader } = this.signRequest('GET', path, host, null, keyId);

    return {
      Host: host,
      Date: dateHeader,
      Signature: signatureHeader,
      Accept: 'application/activity+json, application/ld+json',
    };
  }
}
