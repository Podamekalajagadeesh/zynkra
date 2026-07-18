import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FederationWellKnownController } from '../src/federation/federation.wellknown.controller';
import { FederationService } from '../src/federation/federation.service';
import { ConfigService } from '@nestjs/config';

describe('Federation well-known endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const federationService = {
      webfinger: jest.fn().mockImplementation((resource: string) => {
        if (resource === 'acct:alice@zynkra.local') {
          return {
            subject: resource,
            links: [
              {
                rel: 'self',
                type: 'application/activity+json',
                href: 'https://zynkra.local/federation/users/alice',
              },
            ],
          };
        }
        throw new Error('Not found');
      }),
    };

    const configService = {
      get: (key: string, fallback?: any) => (key === 'INSTANCE_BASE_URL' ? 'https://zynkra.local' : fallback),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [FederationWellKnownController],
      providers: [
        { provide: FederationService, useValue: federationService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns nodeinfo discovery at root .well-known/nodeinfo', async () => {
    const response = await request(app.getHttpServer()).get('/.well-known/nodeinfo');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('links');
    expect(response.body.links[0].href).toBe('https://zynkra.local/.well-known/nodeinfo/2.0');
  });

  it('returns nodeinfo details at root .well-known/nodeinfo/2.0', async () => {
    const response = await request(app.getHttpServer()).get('/.well-known/nodeinfo/2.0');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      version: '2.0',
      software: { name: 'zynkra', version: '1.0.0' },
    });
  });

  it('returns webfinger results at root .well-known/webfinger', async () => {
    const response = await request(app.getHttpServer()).get('/.well-known/webfinger').query({ resource: 'acct:alice@zynkra.local' });

    expect(response.status).toBe(200);
    expect(response.body.subject).toBe('acct:alice@zynkra.local');
  });
});
