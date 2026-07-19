import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatingService } from './dating.service';
import { CrushDto, SwipeDto, UpsertDatingProfileDto } from './dto/dating.dto';

@Controller('dating')
@UseGuards(JwtAuthGuard)
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post('profile')
  async upsertProfile(@Request() req, @Body() dto: UpsertDatingProfileDto) {
    return this.datingService.upsertProfile(req.user.userId, dto);
  }

  @Get('profile')
  async myProfile(@Request() req) {
    return this.datingService.getMyProfile(req.user.userId);
  }

  @Get('candidates')
  async candidates(@Request() req, @Query('take') take?: string) {
    return this.datingService.getCandidates(req.user.userId, take ? +take : 20);
  }

  @Post('swipe')
  async swipe(@Request() req, @Body() dto: SwipeDto) {
    return this.datingService.swipe(req.user.userId, dto.swipedUserId, dto.type);
  }

  @Get('matches')
  async matches(@Request() req) {
    return this.datingService.getMatches(req.user.userId);
  }

  @Post('crush')
  async crush(@Request() req, @Body() dto: CrushDto) {
    return this.datingService.addCrush(req.user.userId, dto.crushedUserId);
  }
}
