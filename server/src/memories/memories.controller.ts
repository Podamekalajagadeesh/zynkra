
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemoriesService } from './memories.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { MemoryEditType } from './entities/memory-edit-revision.entity';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { PortMemoryDto } from './dto/port-memory.dto';

@Controller('memories')
@UseGuards(JwtAuthGuard)
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Post('create')
  createMemory(@CurrentUser() user: User, @Body() body: CreateMemoryDto) {
    return this.memoriesService.createMemory(user, body);
  }

  @Get('feed')
  getFeed(@CurrentUser() user: User) {
    return this.memoriesService.getFeed(user);
  }

  @Get('capsules')
  getTimeCapsules(@CurrentUser() user: User) {
    return this.memoriesService.getTimeCapsules(user);
  }

  @Get('timeline')
  getTimeline(@CurrentUser() user: User) {
    return this.memoriesService.getTimeline(user);
  }

  @Get('on-this-day')
  getOnThisDay(@CurrentUser() user: User) {
    return this.memoriesService.getOnThisDay(user);
  }

  @Get(':id/revisions')
  getMemoryRevisions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.memoriesService.getMemoryRevisions(id, user);
  }

  @Post(':id/revisions')
  createMemoryRevision(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: {
      editType: MemoryEditType;
      title?: string;
      annotation?: string;
      sensoryNote?: string;
      sensoryEnhancements?: any;
      contextNote?: string;
    },
  ) {
    return this.memoriesService.createMemoryRevision(id, user, body);
  }

  @Post(':id/port')
  portMemory(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: PortMemoryDto,
  ) {
    return this.memoriesService.portMemory(id, user, body);
  }

  @Get(':id/ports')
  getMemoryPorts(@Param('id') id: string, @CurrentUser() user: User) {
    return this.memoriesService.getMemoryPorts(id, user);
  }

  @Post('projects')
  createMemoryProject(@CurrentUser() user: User, @Body() body: { title: string; topic?: string; description?: string; memoryIds?: string[]; contributorNames?: string[] }) {
    return this.memoriesService.createMemoryProject(user, body);
  }

  @Get('projects')
  getMemoryProjects(@CurrentUser() user: User) {
    return this.memoriesService.getMemoryProjects(user);
  }

  @Post('documentaries')
  createDocumentary(@CurrentUser() user: User, @Body() body: { eventName: string; title?: string; memoryIds?: string[]; participantNames?: string[] }) {
    return this.memoriesService.createDocumentary(user, body);
  }
}