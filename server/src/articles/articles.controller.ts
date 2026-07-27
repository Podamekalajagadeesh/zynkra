import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req,
    @Body() body: {
      title: string;
      subtitle?: string;
      content: string;
      tags?: string[];
      coverImage?: string;
      status?: 'draft' | 'scheduled';
      scheduledAt?: string;
      isGated?: boolean;
      tokenPrice?: number;
    },
  ) {
    return this.articlesService.create(req.user.userId || req.user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req,
    @Body() body: {
      title?: string;
      subtitle?: string;
      content?: string;
      tags?: string[];
      coverImage?: string;
      isGated?: boolean;
      tokenPrice?: number;
    },
  ) {
    return this.articlesService.update(id, req.user.userId || req.user.id, body);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string, @Req() req) {
    return this.articlesService.publish(id, req.user.userId || req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id') id: string, @Req() req) {
    return this.articlesService.archive(id, req.user.userId || req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req) {
    await this.articlesService.deleteArticle(id, req.user.userId || req.user.id);
  }

  @Get('feed')
  async getFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.articlesService.getFeed({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20,
      tag,
      authorId,
    });
  }

  @Get('drafts')
  @UseGuards(JwtAuthGuard)
  async getDrafts(@Req() req) {
    return this.articlesService.getUserDrafts(req.user.userId || req.user.id);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    // Try fetching by slug first; fall back to by ID if slug looks like a UUID
    const article = await this.articlesService.findBySlug(slug, true);
    if (article) return article;
    // If not found by slug, try by ID (e.g., from editor)
    return this.articlesService.findById(slug);
  }
}
