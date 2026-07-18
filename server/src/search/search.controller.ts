import { Controller, Get, Query, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string) {
    return this.searchService.search(query);
  }

  @Post('reverse-image')
  @UseInterceptors(FileInterceptor('image'))
  async reverseImageSearch(@UploadedFile() file: Express.Multer.File) {
    return this.searchService.reverseImageSearch(file.buffer);
  }
}