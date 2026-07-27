import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewslettersService } from './newsletters.service';

@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Post() @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() body: any) {
    return this.newslettersService.create(req.user.userId || req.user.id, body);
  }

  @Post(':id/send') @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.OK)
  async send(@Param('id') id: string, @Req() req) {
    return this.newslettersService.send(id, req.user.userId || req.user.id);
  }

  @Post('subscribe') @HttpCode(HttpStatus.OK)
  async subscribe(@Body() body: { authorId: string; email: string }) {
    return this.newslettersService.subscribe(body.authorId, body.email);
  }

  @Post('unsubscribe') @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() body: { authorId: string; email: string }) {
    return this.newslettersService.unsubscribe(body.authorId, body.email);
  }

  @Get('feed') async getFeed(@Query('authorId') authorId?: string) {
    return this.newslettersService.getFeed(authorId);
  }

  @Get(':slug') async getBySlug(@Param('slug') slug: string) {
    return this.newslettersService.findBySlug(slug);
  }
}
