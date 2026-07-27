import { Controller, Get, Post, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdvancedSearchService, SearchFilters } from './advanced-search.service';

@Controller('search')
export class AdvancedSearchController {
  constructor(private readonly searchService: AdvancedSearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('dateRange') dateRange?: string,
    @Query('sortBy') sortBy?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: SearchFilters = {
      query: query || '',
      type: (type as any) || 'all',
      dateRange: (dateRange as any) || 'all',
      sortBy: (sortBy as any) || 'relevance',
      tags: tags ? tags.split(',') : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20,
    };
    return this.searchService.search(filters);
  }

  @Get('trending')
  getTrending() {
    return this.searchService.getTrendingSearches();
  }

  @Get('suggestions')
  getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  saveHistory(@Req() req, @Body() body: { query: string }) {
    return this.searchService.saveSearchHistory(req.user.userId || req.user.id, body.query);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(@Req() req) {
    return this.searchService.getSearchHistory(req.user.userId || req.user.id);
  }
}
