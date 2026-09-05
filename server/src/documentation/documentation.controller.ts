import { Controller, Get, Header } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentationService } from './documentation.service';

@ApiTags('documentation')
@Controller('documentation')
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}

  @Get()
  @ApiOperation({ summary: 'Get the developer documentation catalog' })
  getCatalog() {
    return this.documentationService.getCatalog();
  }

  @Get('openapi.json')
  @ApiOperation({ summary: 'Get the live OpenAPI specification' })
  getOpenApiDocument() {
    return this.documentationService.getOpenApiDocument();
  }

  @Get('api-guide')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Get the backend API guide' })
  getApiGuide(): Promise<string> {
    return readFile(join(process.cwd(), '..', 'API_DOCUMENTATION.md'), 'utf8');
  }

  @Get('architecture')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Get the system architecture guide' })
  getArchitectureGuide(): Promise<string> {
    return readFile(join(process.cwd(), '..', 'ARCHITECTURE.md'), 'utf8');
  }

  @Get('development')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Get the development and setup guide' })
  getDevelopmentGuide(): Promise<string> {
    return readFile(join(process.cwd(), '..', 'DEVELOPMENT.md'), 'utf8');
  }
}