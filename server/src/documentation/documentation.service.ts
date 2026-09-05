import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

export interface DocumentationCatalog {
  title: string;
  description: string;
  version: string;
  resources: Array<{
    name: string;
    description: string;
    url: string;
    access: 'public' | 'authenticated';
    format: 'html' | 'json' | 'markdown';
  }>;
}

@Injectable()
export class DocumentationService {
  private openApiDocument: OpenAPIObject | null = null;

  setOpenApiDocument(document: OpenAPIObject): void {
    this.openApiDocument = document;
  }

  getCatalog(): DocumentationCatalog {
    return {
      title: 'Zynkra Developer Documentation',
      description: 'Reference documentation for the Zynkra REST API and integrations.',
      version: this.openApiDocument?.info.version ?? '1.0.0',
      resources: [
        {
          name: 'Interactive API reference',
          description: 'Explore and try the live REST API with Swagger UI.',
          url: '/docs',
          access: 'public',
          format: 'html',
        },
        {
          name: 'OpenAPI specification',
          description: 'Download the machine-readable OpenAPI document.',
          url: '/documentation/openapi.json',
          access: 'public',
          format: 'json',
        },
        {
          name: 'Backend API guide',
          description: 'Authentication, endpoint examples, testing, and release guidance.',
          url: '/documentation/api-guide',
          access: 'public',
          format: 'markdown',
        },
        {
          name: 'GraphQL API',
          description: 'Read-only GraphQL endpoint for users and posts.',
          url: '/graphql',
          access: 'public',
          format: 'html',
        },
        {
          name: 'Platform status',
          description: 'Live service health, incidents, maintenance, and recent checks.',
          url: '/infrastructure/health',
          access: 'public',
          format: 'json',
        },
        {
          name: 'Platform status history',
          description: 'Historical public platform health snapshots.',
          url: '/infrastructure/history',
          access: 'public',
          format: 'json',
        },
        {
          name: 'Product changelog',
          description: 'Published product updates and release notes.',
          url: '/changelog',
          access: 'public',
          format: 'json',
        },
        {
          name: 'Webhook management',
          description: 'Create and manage signed event delivery endpoints.',
          url: '/webhooks/endpoints',
          access: 'authenticated',
          format: 'json',
        },
      ],
    };
  }

  getOpenApiDocument(): OpenAPIObject {
    if (!this.openApiDocument) {
      throw new NotFoundException('OpenAPI documentation is not ready');
    }

    return this.openApiDocument;
  }
}