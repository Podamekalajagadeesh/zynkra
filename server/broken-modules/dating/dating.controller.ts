import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { DatingService } from './dating.service';
import { CreateDatingProfileDto } from './dto/create-dating-profile.dto';
import { UpdateDatingProfileDto } from './dto/update-dating-profile.dto';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { AddSecretCrushDto } from './dto/add-secret-crush.dto';
import { CurrentUser } from '../../src/auth/decorators/current-user.decorator';
import { User } from '../../src/users/entities/user.entity';

@Controller('dating')
@UseGuards(JwtAuthGuard)
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post('profile')
  createOrUpdateProfile(@CurrentUser() user: User, @Body() createDatingProfileDto: CreateDatingProfileDto) {
    return this.datingService.createOrUpdateProfile(user, createDatingProfileDto);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() updateDatingProfileDto: UpdateDatingProfileDto) {
    return this.datingService.createOrUpdateProfile(user, updateDatingProfileDto);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.datingService.getProfile(user);
  }

  @Get('candidates')
  getCandidates(@CurrentUser() user: User) {
    return this.datingService.getCandidates(user);
  }

  @Post('swipe')
  swipe(@CurrentUser() user: User, @Body() createSwipeDto: CreateSwipeDto) {
    return this.datingService.handleSwipe(user, createSwipeDto.swipedUserId, createSwipeDto.type);
  }

  @Get('matches')
  getMatches(@CurrentUser() user: User) {
    return this.datingService.getMatches(user);
  }

  @Post('crush')
  addSecretCrush(@CurrentUser() user: User, @Body() addSecretCrushDto: AddSecretCrushDto) {
    return this.datingService.addSecretCrush(user, addSecretCrushDto.crushedUserId);
  }
}