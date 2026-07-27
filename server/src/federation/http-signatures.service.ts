import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanceKey } from './entities/instance-key.entity';
import * as crypto from 'crypto';

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
 */
@Injectable()
export class HttpSignaturesService {
  private readonly logger = new Logger(HttpSignaturesService.name);
  private cachedPrivateKey: string | null = null;
  private cachedPublicKey: string | null = null;

  constructor(
    @InjectRepository(InstanceKey)
    private readonly instanceKeyRepository: Repository<InstanceKey>,
  ) {}

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
