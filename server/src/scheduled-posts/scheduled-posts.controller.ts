import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScheduledPostsService } from './scheduled-posts.service';
import { CreateScheduledPostDto } from './dto/create-scheduled-post.dto';
import { UpdateScheduledPostDto } from './dto/update-scheduled-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('scheduled-posts')
export class ScheduledPostsController {
  constructor(private readonly scheduledPostsService: ScheduledPostsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateScheduledPostDto) {
    return this.scheduledPostsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.scheduledPostsService.findAll(req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateScheduledPostDto) {
    return this.scheduledPostsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req) {
    return this.scheduledPostsService.cancel(req.user.userId, id);
  }
}
