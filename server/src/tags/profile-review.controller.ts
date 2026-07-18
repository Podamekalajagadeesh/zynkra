import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProfileReviewService } from './profile-review.service';

@Controller('profile-review')
@UseGuards(JwtAuthGuard)
export class ProfileReviewController {
  constructor(private readonly profileReviewService: ProfileReviewService) {}

  @Get('pending')
  getPending(@CurrentUser() user: any) {
    return this.profileReviewService.getPending(user.userId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.profileReviewService.approve(id, user.userId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.profileReviewService.reject(id, user.userId);
  }
}