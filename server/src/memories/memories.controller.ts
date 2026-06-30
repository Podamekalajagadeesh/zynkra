
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemoriesService } from './memories.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('memories')
@UseGuards(JwtAuthGuard)
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get('timeline')
  getTimeline(@CurrentUser() user: User) {
    return this.memoriesService.getTimeline(user);
  }

  @Get('on-this-day')
  getOnThisDay(@CurrentUser() user: User) {
    return this.memoriesService.getOnThisDay(user);
  }
}