import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LinkPreviewsService } from './link-previews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('link-previews')
export class LinkPreviewsController {
  constructor(private readonly linkPreviewsService: LinkPreviewsService) {}

  @Get()
  async get(@Query('url') url?: string) {
    if (!url) {
      throw new BadRequestException('Missing "url" query parameter');
    }
    return this.linkPreviewsService.unfurl(url);
  }
}
