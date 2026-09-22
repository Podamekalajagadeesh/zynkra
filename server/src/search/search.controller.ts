import { Controller, Get, Query, Post, Body, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string, @Req() req) {
    return this.searchService.search(query, req.user.userId || req.user.id);
  }

  @Get('advanced')
  async advancedSearch(
    @Query('q') query: string,
    @Query('type') type?: 'users' | 'posts' | 'hashtags' | 'places' | 'groups' | 'events' | 'products',
    @Query('sort') sort?: 'relevance' | 'date' | 'popularity',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    return this.searchService.advancedSearch({
      query,
      type,
      sort,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      viewerId: req.user.userId || req.user.id,
    });
  }

  @Post('follow-up')
  async followUpSearch(@Body() body: { previousQuery: string; followUpQuery: string }, @Req() req) {
    return this.searchService.followUpSearch(body?.previousQuery, body?.followUpQuery, req.user.userId || req.user.id);
  }

  @Get('web')
  async webSearch(@Query('q') query: string) {
    return this.searchService.webConnectedSearch(query);
  }

  @Post('reverse-image')
  @UseInterceptors(FileInterceptor('image'))
  async reverseImageSearch(@UploadedFile() image: Express.Multer.File) {
    return this.searchService.reverseImageSearch(image);
  }

  @Post('image-text')
  @UseInterceptors(FileInterceptor('image'))
  async imageTextSearch(
    @UploadedFile() image: Express.Multer.File,
    @Query('q') query: string,
  ) {
    return this.searchService.imageTextSearch(query, image);
  }
}