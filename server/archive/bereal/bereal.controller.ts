import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BerealService } from './bereal.service';

@Controller('bereal')
@UseGuards(JwtAuthGuard)
export class BerealController {
  constructor(private readonly berealService: BerealService) {}

  @Get('window-status')
  getWindowStatus(@CurrentUser() user: { userId: string }) {
    return this.berealService.getBerealWindowStatus(user.userId);
  }

  @Post('create')
  createBerealPost(
    @CurrentUser() user: { userId: string },
    @Body() body: { postId: string }
  ) {
    return this.berealService.createBerealPost(user.userId, body.postId);
  }

  @Get('feed')
  getTodayBerealFeed(
    @CurrentUser() user: { userId: string },
    @Query('take') take?: number,
    @Query('skip') skip?: number
  ) {
    return this.berealService.getTodayBerealFeed(user.userId);
  }

  @Get('history/:userId')
  getUserBerealHistory(
    @Param('userId') userId: string,
    @Query('take') take?: number,
    @Query('skip') skip?: number
  ) {
    return this.berealService.getUserBerealHistory(userId, take, skip);
  }
}