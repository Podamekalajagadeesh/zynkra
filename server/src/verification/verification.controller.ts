import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { VerificationService } from './verification.service';
import {
  CreateVerificationRequestDto,
  ReviewVerificationRequestDto,
} from './dto/verification.dto';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('apply')
  async apply(@Request() req, @Body() dto: CreateVerificationRequestDto) {
    return this.verificationService.apply(req.user.userId, dto);
  }

  @Get('me')
  async myRequest(@Request() req) {
    return this.verificationService.getMyRequest(req.user.userId);
  }

  @UseGuards(AdminGuard)
  @Get('pending')
  async pending(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.verificationService.listPending(
      take ? +take : 20,
      skip ? +skip : 0,
    );
  }

  @UseGuards(AdminGuard)
  @Post(':id/review')
  async review(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationRequestDto,
  ) {
    return this.verificationService.review(
      id,
      req.user.userId,
      dto.decision,
      dto.reviewNote,
    );
  }
}
