import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FederationController } from './federation.controller';
import { FederationService } from './federation.service';
import { HttpSignaturesService } from './http-signatures.service';

/**
 * Content-type delivery for the four ActivityPub documents.
 *
 * Nest answers every handler with `application/json` unless the handler says
 * otherwise, so without these headers a peer that honours content negotiation
 * sees an app API response where an ActivityPub document should be. This is an
 * HTTP-level test on purpose: decorator metadata existing is not the same as
 * the wire carrying the header.
 */
describe('Federation actor endpoints — ActivityPub content type', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const federationService = {
      getLocalActor: jest.fn().mockResolvedValue({
        type: 'Person',
        id: 'http://localhost:3001/federation/users/alice',
        endpoints: { sharedInbox: 'http://localhost:3001/federation/inbox' },
      }),
      getLocalFollowers: jest.fn().mockResolvedValue({ type: 'Collection', totalItems: 0 }),
      getLocalFollowing: jest.fn().mockResolvedValue({ type: 'Collection', totalItems: 0 }),
      getLocalOutbox: jest.fn().mockResolvedValue({ type: 'OrderedCollection', orderedItems: [] }),
    };

    const httpSignaturesService = {
      verifyInboundRequest: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
      isInboundVerificationRequired: jest.fn().mockReturnValue(false),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [FederationController],
      providers: [
        { provide: FederationService, useValue: federationService },
        { provide: HttpSignaturesService, useValue: httpSignaturesService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['actor', '/federation/users/alice'],
    ['followers', '/federation/users/alice/followers'],
    ['following', '/federation/users/alice/following'],
    ['outbox', '/federation/users/alice/outbox'],
  ])('serves the %s document as application/activity+json', async (_name, path) => {
    const response = await request(app.getHttpServer()).get(path);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/activity+json');
    // The body must still parse as the document itself — the header override
    // changes only the declared type, never serialization.
    expect(response.body).toHaveProperty('type');
  });

  it('serves the actor document with the shared inbox advertised', async () => {
    const response = await request(app.getHttpServer()).get('/federation/users/alice');

    expect(response.status).toBe(200);
    expect(response.body.endpoints).toEqual({
      sharedInbox: 'http://localhost:3001/federation/inbox',
    });
  });
});
