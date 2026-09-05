import { Controller, Get, Query } from '@nestjs/common';
import { ChangelogService } from './changelog.service';

@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get()
  async listChangelog(@Query('limit') limit?: string) {
    return this.changelogService.list(limit ? Number(limit) : undefined);
  }
}