import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FederationService } from './federation.service';

@Controller()
export class FederationWellKnownController {
  constructor(
    private readonly federationService: FederationService,
    private readonly configService: ConfigService,
  ) {}

  @Get('.well-known/webfinger')
  async webfinger(@Query('resource') resource: string) {
    if (!resource) {
      throw new HttpException('Resource parameter required', HttpStatus.BAD_REQUEST);
    }

    return this.federationService.webfinger(resource);
  }

  @Get('.well-known/nodeinfo')
  nodeInfo() {
    const baseUrl = this.configService.get<string>('INSTANCE_BASE_URL', 'http://localhost:3001').replace(/\/$/, '');

    return {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: `${baseUrl}/.well-known/nodeinfo/2.0`,
        },
      ],
    };
  }

  @Get('.well-known/nodeinfo/2.0')
  nodeInfo2() {
    return {
      version: '2.0',
      software: {
        name: 'zynkra',
        version: '1.0.0',
      },
      protocols: ['activitypub'],
      services: {
        inbound: [],
        outbound: [],
      },
      openRegistrations: false,
      usage: {
        users: {
          total: 0,
          activeHalfYear: 0,
          activeMonth: 0,
        },
      },
      metadata: {
        nodeName: 'Zynkra',
      },
    };
  }
}
