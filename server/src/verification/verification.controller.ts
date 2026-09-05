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
  ReviewVerificationAppealDto,
  SubmitVerificationAppealDto,
} from './dto/verification.dto';
import { VerificationAppealStatus } from './entities/verification-appeal.entity';

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

  @Get('me/history')
  async myHistory(@Request() req) {
    return this.verificationService.getMyHistory(req.user.userId);
  }

  @Post('business')
  async applyBusiness(@Request() req, @Body() dto: CreateVerificationRequestDto) {
    return this.verificationService.apply(req.user.userId, {
      ...dto,
      workflow: 'business' as const,
    });
  }

  @Post('organization')
  async applyOrganization(@Request() req, @Body() dto: CreateVerificationRequestDto) {
    return this.verificationService.apply(req.user.userId, {
      ...dto,
      workflow: 'organization' as const,
    });
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

  @Post('appeals')
  async submitAppeal(@Request() req, @Body() body: { requestId: string; appealDto: SubmitVerificationAppealDto }) {
    return this.verificationService.submitAppeal(req.user.userId, body.requestId, body.appealDto);
  }

  @Get('appeals')
  async getUserAppeals(@Request() req) {
    return this.verificationService.getUserAppeals(req.user.userId);
  }

  @Get('appeals/:appealId')
  async getAppeal(@Request() req, @Param('appealId') appealId: string) {
    return this.verificationService.getAppeal(appealId, req.user.userId);
  }

  @UseGuards(AdminGuard)
  @Get('admin/appeals')
  async listAppeals(@Query('status') status?: VerificationAppealStatus) {
    return this.verificationService.listAppeals(status);
  }

  @UseGuards(AdminGuard)
  @Post('admin/appeals/:appealId/under-review')
  async markAppealUnderReview(@Request() req, @Param('appealId') appealId: string) {
    return this.verificationService.markAppealUnderReview(appealId, req.user.userId);
  }

  @UseGuards(AdminGuard)
  @Post('admin/appeals/:appealId/approve')
  async approveAppeal(@Request() req, @Param('appealId') appealId: string, @Body() dto: ReviewVerificationAppealDto) {
    return this.verificationService.reviewAppeal(appealId, req.user.userId, VerificationAppealStatus.APPROVED, dto.notes);
  }

  @UseGuards(AdminGuard)
  @Post('admin/appeals/:appealId/reject')
  async rejectAppeal(@Request() req, @Param('appealId') appealId: string, @Body() dto: ReviewVerificationAppealDto) {
    return this.verificationService.reviewAppeal(appealId, req.user.userId, VerificationAppealStatus.REJECTED, dto.notes);
  }
}
