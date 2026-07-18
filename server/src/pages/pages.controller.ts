import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly insightsService: InsightsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/sentiment-insights')
  getSentimentInsights(@Param('id') id: string) {
    return this.insightsService.getSentimentInsights(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPageDto: CreatePageDto, @Request() req) {
    return this.pagesService.create(createPageDto, req.user);
  }

  @Get()
  findAll() {
    return this.pagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto, @Request() req) {
    return this.pagesService.update(id, updatePageDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.pagesService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/message')
  message(@Param('id') id: string, @Body() body: { content: string }, @Request() req) {
    return this.pagesService.message(id, body.content, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/conversations')
  getConversations(@Param('id') id: string, @Request() req) {
    return this.pagesService.getConversations(id, req.user);
  }
}