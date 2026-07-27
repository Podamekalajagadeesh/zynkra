import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcastsService: PodcastsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() body: any) {
    return this.podcastsService.create(req.user.userId || req.user.id, body);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string, @Req() req) {
    return this.podcastsService.publish(id, req.user.userId || req.user.id);
  }

  @Get('feed')
  async getFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
  ) {
    return this.podcastsService.getFeed({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20,
      tag,
    });
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.podcastsService.findBySlug(slug, true);
  }
}
