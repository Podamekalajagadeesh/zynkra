import { Controller, Get, Param, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { CreateReelEffectDto } from './dto/create-reel-effect.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reels')
@UseGuards(JwtAuthGuard)
export class ReelsController {
  constructor(private reelsService: ReelsService) {}

  @Get('/effects')
  getReelEffects() {
    return this.reelsService.getReelEffects();
  }

  @Post('/effects')
  createReelEffect(@Body() createReelEffectDto: CreateReelEffectDto) {
    return this.reelsService.createReelEffect(createReelEffectDto);
  }

  @Put('/effects/:id')
  updateReelEffect(@Param('id') id: string, @Body() updateReelEffectDto: Partial<CreateReelEffectDto>) {
    return this.reelsService.updateReelEffect(id, updateReelEffectDto);
  }

  @Delete('/effects/:id')
  deleteReelEffect(@Param('id') id: string) {
    return this.reelsService.deleteReelEffect(id);
  }

  @Get('/user/:userId')
  getUserReels(@Param('userId') userId: string) {
    return this.reelsService.getUserReels(userId);
  }

  @Get(':id')
  getReelById(@Param('id') id: string) {
    return this.reelsService.getReelById(id);
  }

  @Get('/suggestions')
  getReelSuggestions(@CurrentUser() user: User) {
    return this.reelsService.getReelSuggestions(user);
  }

  @Post()
  createReel(@Body() createReelDto: CreateReelDto, @CurrentUser() user: User) {
    return this.reelsService.createReel(createReelDto, user);
  }

  @Put(':id')
  updateReel(@Param('id') id: string, @Body() updateReelDto: UpdateReelDto, @CurrentUser() user: User) {
    return this.reelsService.updateReel(id, updateReelDto, user);
  }

  @Delete(':id')
  deleteReel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reelsService.deleteReel(id, user);
  }

  @Post(':id/share')
  shareReel(@Param('id') id: string) {
    return this.reelsService.shareReel(id);
  }

  @Post(':id/view')
  trackView(@Param('id') id: string) {
    return this.reelsService.trackView(id);
  }

  @Get(':id/insights')
  getReelInsights(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reelsService.getReelInsights(id, user);
  }
}