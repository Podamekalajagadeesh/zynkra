
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() createCollectionDto: CreateCollectionDto, @Req() req) {
    return this.bookmarksService.createCollection(createCollectionDto, req.user.id);
  }

  @Get()
  findAll(@Req() req) {
    return this.bookmarksService.findAllCollections(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.bookmarksService.findOneCollection(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Req() req,
  ) {
    return this.bookmarksService.updateCollection(
      id,
      updateCollectionDto,
      req.user.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.bookmarksService.removeCollection(id, req.user.id);
  }
}