import { NotFoundException } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { DocumentationService } from './documentation.service';

describe('DocumentationService', () => {
  it('returns a catalog linked to the live API resources', () => {
    const service = new DocumentationService();

    expect(service.getCatalog()).toEqual(expect.objectContaining({
      title: 'Zynkra Developer Documentation',
      version: '1.0.0',
    }));
    expect(service.getCatalog().resources).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: '/docs' }),
      expect.objectContaining({ url: '/documentation/openapi.json' }),
      expect.objectContaining({ url: '/documentation/api-guide' }),
      expect.objectContaining({ url: '/graphql', access: 'public' }),
      expect.objectContaining({ url: '/webhooks/endpoints', access: 'authenticated' }),
    ]));
  });

  it('returns the OpenAPI document registered during bootstrap', () => {
    const service = new DocumentationService();
    const document = {
      openapi: '3.0.0',
      info: { title: 'Zynkra API', version: '2.0.0' },
      paths: {},
    } as OpenAPIObject;

    service.setOpenApiDocument(document);

    expect(service.getOpenApiDocument()).toBe(document);
    expect(service.getCatalog().version).toBe('2.0.0');
  });

  it('rejects requests before bootstrap registers the document', () => {
    expect(() => new DocumentationService().getOpenApiDocument()).toThrow(NotFoundException);
  });
});