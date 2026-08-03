import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GifsService } from './gifs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('gifs')
export class GifsController {
  constructor(private readonly gifsService: GifsService) {}

  @Get('search')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    if (!q) {
      throw new BadRequestException('Missing "q" query parameter');
    }
    return this.gifsService.search(q, limit ? Math.min(Math.max(+limit, 1), 50) : 24);
  }
}
