import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationEvent } from './reputation.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('reputation')
export class ReputationController {
  constructor(
    private readonly reputationService: ReputationService,
    private readonly usersService: UsersService
  ) {}

  @Get(':userId')
  async getReputation(@Param('userId') userId: string) {
    return this.reputationService.getReputation(userId);
  }

  // Endpoint to track data sharing and reward users with cryptocurrency
  @Post('data-shared')
  @UseGuards(JwtAuthGuard)
  async recordDataShared(@Body() body: { userId: string }) {
    const user = await this.usersService.findOneById(body.userId);
    if (user) {
      await this.reputationService.addReputation(ReputationEvent.DATA_SHARED, user);
    }
    return { success: true };
  }
}