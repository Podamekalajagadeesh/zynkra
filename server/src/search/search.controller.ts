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