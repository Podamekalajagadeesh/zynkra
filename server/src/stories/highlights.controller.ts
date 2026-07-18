import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stories/highlights')
@UseGuards(JwtAuthGuard)
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Post()
  create(@Body() createHighlightDto: CreateHighlightDto, @Request() req) {
    return this.highlightsService.create(createHighlightDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.highlightsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.highlightsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHighlightDto: UpdateHighlightDto, @Request() req) {
    return this.highlightsService.update(id, updateHighlightDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.highlightsService.remove(id, req.user);
  }
}