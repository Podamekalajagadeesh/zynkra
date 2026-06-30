import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() createBookmarkDto: CreateBookmarkDto, @Request() req) {
    return this.bookmarksService.create(createBookmarkDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.bookmarksService.findAll(req.user);
  }

  @Delete(':postId')
  remove(@Param('postId') postId: string, @Request() req) {
    return this.bookmarksService.remove(postId, req.user);
  }
}